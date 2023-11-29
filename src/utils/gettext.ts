/**
 * See https://www.gnu.org/savannah-checkouts/gnu/gettext/manual/html_node/PO-Files.html
 */
import { fs } from '@tauri-apps/api';
import { isNil, uniqueId } from 'lodash-es';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
} from 'path-browserify';

export const DEFAULT_CONTEXT = 'default';

export enum MsgMetaType {
  COMMENT = '#',
  EXTRACTED = '#.',
  REFERENCE = '#:',
  FLAGS = '#,',
  MODULES = '#-',
}

export interface POTemplate {
  msg: Msg[];
  id: Map<string, MsgId>;
}

export interface MsgId {
  context: string;
  id: string;
  plural?: string;
}

export interface Msg {
  id: string; // uuid of msgid
  str: string[];
  meta: MsgMetaData;
}

export interface MsgMetaData {
  reference: string[]; // #:
  flags: Set<string>; // #,
  modules: Set<string>; // #-
  comment: string[]; // #
  extracted: string[]; // #.
}

export interface Locale {
  path: string;
  code: string;
  msgs: Msg[];
}

export class Gettext {
  constructor(
    readonly path: string,
    readonly template: POTemplate,
    readonly locales: Map<string, Locale> = new Map()
  ) {}

  get basePath() {
    return dirname(this.path);
  }

  relativePath(path: string) {
    return relative(this.basePath, path);
  }

  absolutePath(path: string) {
    if (isAbsolute(path)) {
      return path;
    }
    return join(this.basePath, path);
  }

  removeTemplateMsgId(msgUuid: string) {
    this.template.id.delete(msgUuid);
  }

  untranslatedMsgStrOf(localeCode: string) {
    const map: Record<
      string,
      {
        untranslated: boolean;
        msg: Msg;
      }
    > = {};
    this.locales.get(localeCode)?.msgs.forEach((msg) => {
      const str = msg.str[0];
      if (msg.str.length === 1) {
        map[msg.id] = { untranslated: str.length === 0, msg };
      } else {
        map[msg.id] = {
          untranslated: false,
          msg,
        };
      }
    });
    return this.template.msg
      .slice(1)
      .filter((msg) => {
        if (map[msg.id] === undefined) return true;
        return map[msg.id].untranslated;
      })
      .map((msg) => {
        return (
          map[msg.id].msg ??
          msgInit({
            id: msg.id,
          })
        );
      });
  }

  hasUntranslatedMsgId(localeCode: string) {
    const untranslated: Record<string, boolean> = {};
    this.locales.get(localeCode)?.msgs.forEach((msg) => {
      const str = msg.str[0];
      if (msg.str.length === 1) {
        untranslated[msg.id] = str.length === 0;
      } else {
        untranslated[msg.id] = false;
      }
    });
    for (const msg of this.template.msg.slice(1)) {
      if (untranslated[msg.id] ?? true) {
        return true;
      }
    }
    return false;
  }

  /**
   * This method will return UUID of the message if found,
   * otherwise a new UUID.
   */
  createMsg(options: { context?: string; id: string; plural?: string }) {
    let { context, id, plural } = options;
    context = context ?? DEFAULT_CONTEXT;
    for (const [uuid, msgid] of this.template.id) {
      if (msgid.context === context && msgid.id === id) {
        return uuid;
      }
    }
    const uuid = uniqueId();
    this.template.id.set(uuid, {
      context,
      id,
      plural,
    });
    return uuid;
  }

  appendMsgId(options: { context?: string; id: string; plural?: string }) {
    const uuid = this.createMsg(options);
    if (this.template.msg.find((msg) => msg.id === uuid)) return;
    this.template.msg.push(msgInit({ id: uuid }));
  }

  filterMsgId(options: { context?: string; id?: string; plural?: string }) {
    const { context, id, plural } = options;
    return Array.from(this.template.id.values()).filter((msgId: MsgId) => {
      if (context && msgId.context !== context) return false;
      if (id && msgId.id !== id) return false;
      if (plural && msgId.plural !== plural) return false;
      return true;
    });
  }

  createLocale(path: string, code: string) {
    const locale = localeInit(path, code, this.template.msg[0].id);
    this.locales.set(code, locale);
    this.addModule(path);
    return locale;
  }

  importLocaleFromString(path: string, text: string) {
    const res = gettextMsgsParser(text);
    this.addModule(path);
    const uuidMap: Record<string, Record<string, string>> = {};
    for (const [uuid, { context, id }] of this.template.id) {
      if (uuidMap[context]) {
        uuidMap[context][id] = uuid;
      } else {
        uuidMap[context] = { [id]: uuid };
      }
    }
    for (const msg of res.msg) {
      const sourceMsgId = res.id.get(msg.id);
      if (isNil(sourceMsgId)) continue;
      const { context, id } = sourceMsgId;
      const uuid = uuidMap[context][id];
      if (uuid) {
        msg.id = uuid;
      } else {
        this.template.id.set(msg.id, sourceMsgId);
      }
    }
    const code = basename(path, extname(path));
    const locale = {
      path,
      code,
      msgs: res.msg,
    };
    this.locales.set(code, locale);
    return locale;
  }

  public static async load(path: string) {
    const text = await fs.readTextFile(path);
    if (!isAbsolute(path)) {
      throw new Error('path must be absolute');
    }
    const res = gettextMsgsParser(text);
    const absModules = new Set<string>();
    res.msg[0].meta.modules.forEach((module) => {
      absModules.add(join(dirname(path), module));
    });
    res.msg[0].meta.modules = absModules;
    const project = new Gettext(path, res);

    await Promise.all(
      // read all modules
      project?.modules.map(async (module) => {
        if (!(await fs.exists(module))) {
          return;
        }
        return {
          path: module,
          text: await fs.readTextFile(module),
        };
      }) ?? []
    ).then((data) => {
      data.forEach((result) => {
        if (result) {
          const { path, text } = result;
          project?.importLocaleFromString(path, text);
        }
      });
    });
    return project;
  }

  getMsgId(id: string) {
    return this.template.id.get(id);
  }

  dumpTemplate() {
    const absModules = this.meta.modules;
    let data;
    try {
      this.meta.modules = new Set(
        Array.from(absModules).map((path) => {
          return this.relativePath(path);
        })
      );
      data = {
        path: this.path,
        data: msgsToLines(this.template.id, this.template.msg),
      };
    } catch (e) {
      console.error(e);
    }
    this.meta.modules = absModules;
    return data;
  }

  dumpLocale(code: string) {
    const locale = this.locales.get(code);
    if (!locale) return;
    const data = msgsToLines(this.template.id, locale.msgs);
    return {
      data,
      path: locale.path,
    };
  }

  dumpAll() {
    const locales: {
      path: string;
      data: string;
    }[] = [];
    for (const [code] of this.locales) {
      const data = this.dumpLocale(code);
      if (data) locales.push(data);
    }
    const data = this.dumpTemplate();
    if (data) locales.push(data);
    return locales;
  }

  updateLocale(code: string, msg: Msg) {
    const srcMsg =
      this.locales.get(code)?.msgs.findIndex((src) => src.id === msg.id) ?? -1;
    if (srcMsg >= 0) {
      this.locales.get(code)?.msgs.splice(srcMsg, 1, msg);
    } else if (this.template.id.has(msg.id)) {
      this.locales.get(code)?.msgs.push(msg);
    }
  }

  findMsgId(id: string) {
    return this.template.id.get(id);
  }

  findLocale(code: string) {
    return this.locales.get(code);
  }

  findMsgStr(code: string, id: string) {
    return (
      this.findLocale(code)?.msgs.find((msg) => msg.id === id) ??
      msgInit({
        id,
      })
    );
  }

  addModule(path: string) {
    this.meta.modules.add(this.absolutePath(path));
  }

  get modules() {
    return Array.from(this.meta.modules);
  }

  get meta() {
    return this.template.msg[0].meta;
  }
}

export function convertPathToCode(path: string) {
  return basename(path, extname(path));
}

const MsgidParts = /^msgid "(.*)"$/;
const MsgstrParts = /^msgstr "(.*)"$/;
const MsgidPluralParts = /^msgid_plural "(.*)"$/;

export function gettextMsgsParser(text: string): POTemplate {
  if (!checkPoText(text)) {
    throw new Error('error.invalid_po_file');
  }
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const template: POTemplate = {
    msg: [],
    id: new Map(),
  };
  const id_record: Record<string, Record<string, string>> = {};
  for (let i = 0; i < lines.length; ++i) {
    const flags = new Set<string>();
    const reference: string[] = [];
    const translator: string[] = [];
    const extracted: string[] = [];
    const modules: string[] = [];
    let msgid: MsgId | undefined;
    let msgstr: string[] | undefined;
    let context: string | undefined;

    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith(MsgMetaType.FLAGS)) {
        flags.add(line.substring(2).trim());
      } else if (line.startsWith(MsgMetaType.REFERENCE)) {
        reference.push(line.substring(2).trim());
      } else if (line.startsWith(MsgMetaType.EXTRACTED)) {
        extracted.push(line.substring(2).trim());
      } else if (line.startsWith(MsgMetaType.MODULES)) {
        modules.push(line.substring(2).trim());
      } else if (line.startsWith(MsgMetaType.COMMENT)) {
        translator.push(line.substring(1).trim());
      } else if (MsgidParts.test(line) && MsgstrParts.test(lines[i + 1])) {
        if (msgid === undefined && msgstr === undefined) {
          msgid = {
            id: MsgidParts.exec(line)![1],
            context: DEFAULT_CONTEXT,
            plural: undefined, // TODO: handle plural
          };
          msgstr = [MsgstrParts.exec(lines[++i])![1]];
        } else {
          throw new Error('error.invalid_po_file');
        }
        while (
          i < lines.length - 1 &&
          lines[i + 1].startsWith('"') &&
          lines[i + 1].endsWith('"')
        ) {
          msgstr.push(lines[++i].slice(1, -1));
        }
        if (msgstr.length > 1 && msgstr[0].length === 0) {
          msgstr = msgstr.slice(1);
        }
        break;
      } else {
        throw new Error('error.invalid_po_file');
      }
      ++i;
    }
    if (msgid === undefined || msgstr === undefined) {
      throw new Error('error.invalid_po_file');
    }
    let id = uniqueId();
    if (id_record[msgid.context] === undefined) {
      id_record[msgid.context] = {
        [msgid.id]: id,
      };
    } else if (id_record[msgid.context][msgid.id] === undefined) {
      id_record[msgid.context][msgid.id] = id;
    } else {
      id = id_record[msgid.context][msgid.id];
    }
    if (isNil(template.id.get(id))) {
      template.id.set(id, msgid);
    }
    const msg: Msg = {
      id,
      str: msgstr,
      meta: {
        comment: translator,
        extracted,
        reference,
        flags,
        modules: new Set(modules),
      },
    };
    template.msg.push(msg);
  }
  if (template.msg.length === 0) throw Error('error.invalid_po_file');
  return template;
}

function msgsToLines(map: Map<string, MsgId>, msgs: Msg[]) {
  return msgs.map((msg) => msgToLines(map, msg).join('\n')).join('\n\n');
}

function msgToLines(map: Map<string, MsgId>, msg: Msg) {
  const msgId = map.get(msg.id);
  if (msgId === undefined) {
    throw new Error('error.unknown_msg');
  }
  const lines: string[] = [
    ...convertMetaToString(MsgMetaType.COMMENT, msg.meta.comment),
    ...convertMetaToString(MsgMetaType.REFERENCE, msg.meta.reference),
    ...convertMetaToString(MsgMetaType.EXTRACTED, msg.meta.extracted),
    ...convertMetaToString(MsgMetaType.MODULES, Array.from(msg.meta.modules)),
    ...convertMetaToString(MsgMetaType.FLAGS, Array.from(msg.meta.flags)),
    `msgid "${msgId.id}"`,
  ];
  // TODO: handle plural
  // TODO: handle context
  if (msgId.plural) {
    lines.push(`msgid_plural "${msgId.plural}"`);
  }
  if (msg.str.length === 0) {
    throw new Error('error.invalid_msg');
  } else if (msg.str.length === 1) {
    lines.push(`msgstr "${msg.str[0]}"`);
  } else {
    lines.push('msgstr ""', ...msg.str.map((str) => `"${str}"`));
  }
  return lines;
}

function convertMetaToString(type: MsgMetaType, arr: string[]) {
  switch (type) {
    case MsgMetaType.COMMENT:
    case MsgMetaType.REFERENCE:
    case MsgMetaType.EXTRACTED:
    case MsgMetaType.MODULES:
    case MsgMetaType.FLAGS:
      return arr.map((item) => `${type} ${item}`);
    default:
      throw new Error('error.unknown_msg_meta_type');
  }
}

export function checkPoText(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      !['msgid', 'msgstr', '#', '"'].some((prompt) => line.startsWith(prompt))
    ) {
      return false;
    }
  }
  return true;
}

export function localeInit(path: string, code: string, msgId?: string): Locale {
  return {
    path,
    code,
    msgs: [msgInit({ id: msgId })],
  };
}

interface MsgInitOptions {
  id?: string;
  str?: string[];
  meta?: MsgMetaData;
}
export function msgInit({ id, str, meta }: MsgInitOptions = {}) {
  return {
    id: id ?? '',
    str: str ?? [''],
    meta: meta ?? msgMetaInit(),
  };
}

interface MsgMetaDataInitOptions {
  comment?: string[];
  extracted?: string[];
  reference?: string[];
  flags?: Set<string>;
  modules?: Set<string>;
}
export function msgMetaInit({
  comment,
  extracted,
  reference,
  flags,
  modules,
}: MsgMetaDataInitOptions = {}) {
  return {
    comment: comment ?? [],
    extracted: extracted ?? [],
    reference: reference ?? [],
    flags: flags ?? new Set<string>(),
    modules: modules ?? new Set<string>(),
  };
}
