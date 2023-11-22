/**
 * See https://www.gnu.org/savannah-checkouts/gnu/gettext/manual/html_node/PO-Files.html
 */

export interface Msg {
  id: string;
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

const MsgidParts = /^msgid "(.*)"$/;
const MsgstrParts = /^msgstr "(.*)"$/;
const MsgidPluralParts = /^msgid_plural "(.*)"$/;

export function gettextMsgsParser(text: string) {
  if (!checkPoText(text)) {
    return;
  }
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const msgs: Msg[] = [];
  for (let i = 0; i < lines.length; ++i) {
    const flags = new Set<string>();
    const reference: string[] = [];
    const translator: string[] = [];
    const extracted: string[] = [];
    const modules: string[] = [];
    let msgstr = '';
    let msgid = '';

    while (true) {
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
        msgid = MsgidParts.exec(line)![1];
        msgstr = MsgstrParts.exec(lines[++i])![1];
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
    const msg: Msg = {
      id: msgid,
      str: msgstr,
      comment: {
        translator,
        extracted,
      },
      reference,
      flags,
      modules,
    };
    msgs.push(msg);
  }
  return msgs;
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
