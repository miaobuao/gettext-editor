/**
 * See https://www.gnu.org/savannah-checkouts/gnu/gettext/manual/html_node/PO-Files.html
 */
import { clone, isNil, uniqueId } from 'lodash';
import { basename, extname } from 'path-browserify';

export const DEFAULT_CONTEXT = 'default';

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
  str: string;
  comment: MsgComment;
  reference: string[]; // #:
  flags: Set<string>; // #,
  modules: string[]; // #-
}

export interface MsgComment {
  translator: string[]; // #
  extracted: string[]; // #.
}

export class Gettext {
  constructor(
    readonly template: POTemplate,
    readonly locales: Map<string, Locale> = new Map()
  ) {}

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
    const locale = {
      path,
      code,
      msgs: [],
    };
    this.locales.set(code, locale);
    return locale;
  }

  importLocaleFromString(path: string, text: string) {
    const res = gettextMsgsParser(text);
    if (isNil(res)) {
      return;
    }
    const uuidMap: Record<string, Record<string, string>> = {};
    for (const [uuid, { context, id }] of res.id) {
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
      }
    }
    const code = basename(path, extname(path));
    const locale = {
      path: code,
      code,
      msgs: res.msg,
    };
    this.locales.set(code, locale);
    return locale;
  }

  public static parse(text: string) {
    const res = gettextMsgsParser(text);
    if (isNil(res)) {
      return;
    }
    return new Gettext(res);
  }

  get modules() {
    return clone(this.template.msg.at(0)?.modules ?? []);
  }
}

const MsgidParts = /^msgid "(.*)"$/;
const MsgstrParts = /^msgstr "(.*)"$/;
const MsgidPluralParts = /^msgid_plural "(.*)"$/;

export function gettextMsgsParser(text: string): POTemplate | undefined {
  if (!checkPoText(text)) {
    return;
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
    let msgstr: string | undefined;
    let context: string | undefined;

    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith('#,')) {
        flags.add(line.substring(2).trim());
      } else if (line.startsWith('#:')) {
        reference.push(line.substring(2).trim());
      } else if (line.startsWith('#.')) {
        extracted.push(line.substring(2).trim());
      } else if (line.startsWith('#-')) {
        modules.push(line.substring(2).trim());
      } else if (line.startsWith('#')) {
        translator.push(line.substring(1).trim());
      } else if (MsgidParts.test(line) && MsgstrParts.test(lines[i + 1])) {
        if (msgid === undefined && msgstr === undefined) {
          msgid = {
            id: MsgidParts.exec(line)![1],
            context: DEFAULT_CONTEXT,
            plural: undefined, // TODO: handle plural
          };
          msgstr = MsgstrParts.exec(lines[++i])![1];
        } else {
          return;
        }
        while (
          i < lines.length - 1 &&
          lines[i + 1].startsWith('"') &&
          lines[i + 1].endsWith('"')
        ) {
          msgstr += lines[++i].slice(1, -1);
        }
        break;
      } else {
        return;
      }
      ++i;
    }
    if (msgid === undefined || msgstr === undefined) return;
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
      comment: {
        translator,
        extracted,
      },
      reference,
      flags,
      modules,
    };
    template.msg.push(msg);
  }
  return template;
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
