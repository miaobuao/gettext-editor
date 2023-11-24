/**
 * See https://www.gnu.org/savannah-checkouts/gnu/gettext/manual/html_node/PO-Files.html
 */
import { clone, isNil, uniqueId } from 'lodash';
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

  /**
   * This method will return UUID of the message if found,
   * otherwise a new UUID.
   */
  createMsg(context: string, id: string, plural?: string) {
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

  public static parse({ path, text }: { path: string; text: string }) {
    if (!isAbsolute(path)) {
      throw new Error('path must be absolute');
    }
    const res = gettextMsgsParser(text);
    const absModules = new Set<string>();
    res.msg[0].meta.modules.forEach((module) => {
      absModules.add(join(dirname(path), module));
    });
    res.msg[0].meta.modules = absModules;
    return new Gettext(path, res);
  }

  dump() {
    const locales: {
      path: string;
      data: string;
    }[] = [];
    for (const [code, locale] of this.locales) {
      const blocks = msgsToLines(this.template.id, locale.msgs);
      locales.push({
        path: locale.path,
        data: blocks,
      });
    }
    // convert template
    const absModules = this.meta.modules;
    this.meta.modules = new Set(
      Array.from(absModules).map((path) => {
        return this.relativePath(path);
      })
    );
    locales.push({
      path: this.path,
      data: msgsToLines(this.template.id, this.template.msg),
    });
    this.meta.modules = absModules;
    return locales;
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
    msgs: [
      {
        id: msgId ?? '',
        str: [''],
        meta: {
          comment: [],
          extracted: [],
          reference: [],
          flags: new Set<string>(),
          modules: new Set<string>(),
        },
      },
    ],
  };
}
