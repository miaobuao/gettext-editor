import { fs } from '@tauri-apps/api';
import { clone, isNil, uniqueId } from 'lodash-es';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
} from 'path-browserify';
import {
  POTemplate,
  Locale,
  msgInit,
  msgMetaInit,
  Msg,
  MsgId,
  DEFAULT_CONTEXT,
  localeInit,
  gettextMsgsParser,
  msgsToLines,
  MsgMetaData,
  convertPathToCode,
} from './parse';

export * from './parse';

export interface AutoSaveOption {
  save?: boolean;
}

export interface DeleteLocaleOption {
  deleteLocale?: boolean;
}

export class Gettext {
  path: string;
  template: POTemplate;
  locales: Map<string, Locale>;

  constructor(
    path: string,
    template: POTemplate,
    locales: Map<string, Locale> = new Map()
  ) {
    this.path = path;
    this.template = reactive(template);
    this.locales = reactive(locales);
  }

  public static async load(path: string) {
    const text = await fs.readTextFile(path);
    if (!isAbsolute(path)) {
      throw new Error('path must be absolute');
    }
    const res = gettextMsgsParser(text);
    const absModules = new Set<string>();
    res.msg[0].meta.modules.forEach((module) => {
      if (isAbsolute(module)) {
        absModules.add(module);
      } else {
        absModules.add(join(dirname(path), module));
      }
    });
    res.msg[0].meta.modules = absModules;
    const project = new Gettext(path, res);

    await Promise.all(
      // read all modules
      [...project?.modules.value].map(async (module) => {
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

  public cloneFrom = (source: Gettext) => {
    this.path = clone(source.path);
    this.template.id = clone(source.template.id);
    this.template.msg = clone(source.template.msg);
    this.locales.clear();
    for (const [k, v] of clone(source.locales)) {
      this.locales.set(k, v);
    }
  };

  get basePath() {
    return dirname(this.path);
  }

  public relativePath = (path: string) => {
    return relative(this.basePath, path);
  };

  public absolutePath = (path: string) => {
    if (isAbsolute(path)) {
      return path;
    }
    return join(this.basePath, path);
  };

  public removeTemplateMsgId = async (
    msgUuid: string,
    options: AutoSaveOption = { save: true }
  ) => {
    this.template.id.delete(msgUuid);
    if (options.save) return this.saveTemplate();
  };

  public readonly removeLocale = async (
    localeCode: string,
    options: AutoSaveOption = { save: true }
  ) => {
    if (!this.locales.has(localeCode)) return;
    const { path } = this.locales.get(localeCode)!;
    const relative = this.relativePath(path);
    this.removeModule(relative);
    this.locales.delete(localeCode);
    if (options.save) return this.saveTemplate();
  };

  public readonly untranslatedMsgStrOf = (localeCode: string) => {
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
  };

  public readonly hasUntranslatedMsgId = (localeCode: string) => {
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
  };

  /**
   * This method will return UUID of the message if found,
   * otherwise a new UUID.
   */
  public readonly createMsg = (options: {
    context?: string;
    id: string;
    plural?: string;
  }) => {
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
  };

  public readonly appendMsgId = (options: {
    context?: string;
    id: string;
    plural?: string;
  }) => {
    const uuid = this.createMsg(options);
    if (this.template.msg.find((msg) => msg.id === uuid)) return;
    this.template.msg.push(msgInit({ id: uuid }));
  };

  public readonly filterMsgId = (options: {
    context?: string;
    id?: string;
    plural?: string;
  }) => {
    const { context, id, plural } = options;
    return Array.from(this.template.id.values()).filter((msgId: MsgId) => {
      if (context && msgId.context !== context) return false;
      if (id && msgId.id !== id) return false;
      if (plural && msgId.plural !== plural) return false;
      return true;
    });
  };

  public readonly createLocale = (path: string, code: string) => {
    const locale = localeInit(path, code, this.template.msg[0].id);
    this.locales.set(code, locale);
    this.addModule(path);
    return locale;
  };

  public readonly importLocaleFromString = (path: string, text: string) => {
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
  };

  public readonly getMsgId = (id: string) => {
    return this.template.id.get(id);
  };

  public readonly dumpTemplate = () => {
    const absModules = [...this.modules.value];
    let data;
    try {
      this.modules.value = new Set(
        absModules.map((path) => {
          return this.relativePath(path);
        })
      );
      data = {
        path: this.path,
        data: msgsToLines(this.template.id, this.template.msg),
      };
    } catch (e) {
      console.trace(e);
    }
    this.modules.value = new Set(absModules);
    return data;
  };

  public readonly dumpLocale = (code: string) => {
    const locale = this.locales.get(code);
    if (!locale) return;
    const data = msgsToLines(this.template.id, locale.msgs);
    return {
      data,
      path: locale.path,
    };
  };

  public readonly dumpAll = () => {
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
  };

  public readonly updateLocale = async (
    code: string,
    msg: Msg,
    options: AutoSaveOption = { save: true }
  ) => {
    const srcMsg =
      this.locales.get(code)?.msgs.findIndex((src) => src.id === msg.id) ?? -1;
    if (srcMsg >= 0) {
      this.locales.get(code)?.msgs.splice(srcMsg, 1, msg);
    } else if (this.template.id.has(msg.id)) {
      this.locales.get(code)?.msgs.push(msg);
    }
    if (options.save) return this.saveLocale(code);
  };

  public readonly saveTemplate = () => {
    const data = this.dumpTemplate();
    if (!data) return;
    return fs.writeTextFile(data.path, data.data);
  };

  public readonly saveLocale = (code: string) => {
    const data = this.dumpLocale(code);
    if (!data) return;
    return fs.writeTextFile(data.path, data.data);
  };

  public readonly saveAll = async () => {
    for (const data of this.dumpAll()) {
      await fs.writeTextFile(data.path, data.data);
    }
  };

  public readonly updateMsgId = async (
    id: string,
    msgid: MsgId,
    options: AutoSaveOption = { save: true }
  ) => {
    this.template.id.set(id, msgid);
    if (options.save) return await this.saveAll();
  };

  public readonly findMsgId = (id: string) => {
    return this.template.id.get(id);
  };

  public readonly findLocale = (code: string) => {
    return this.locales.get(code);
  };

  public readonly findMsgStr = (code: string, id: string) => {
    return (
      this.findLocale(code)?.msgs.find((msg) => msg.id === id) ??
      msgInit({
        id,
      })
    );
  };

  readonly addModule = (
    path: string,
    options: AutoSaveOption = { save: true }
  ) => {
    this.modules.value.add(this.absolutePath(path));
    if (options.save) this.saveTemplate();
  };

  /**
   * will `not` remove locale
   */
  readonly removeModule = (
    path: string,
    options: AutoSaveOption = {
      save: true,
    }
  ) => {
    if (isAbsolute(path)) {
      this.modules.value.delete(path);
    } else {
      const absPath = this.absolutePath(path);
      this.modules.value.delete(absPath);
    }
    if (options.save) this.saveTemplate();
  };

  public meta = computed({
    get: () => clone(this.template.msg.at(0)?.meta) ?? msgMetaInit(),
    set: (value) => {
      if (value) this.template.msg[0].meta = value;
    },
  });
  public modules = computed({
    get: () => this.meta.value.modules,
    set: (value) => {
      if (this.meta.value && value) {
        this.updateMeta({
          modules: value,
        });
      }
    },
  });

  updateMeta(value: Partial<MsgMetaData>) {
    const meta = this.meta.value;
    for (const key of Object.keys(value) as (keyof MsgMetaData)[]) {
      meta[key] = value[key] as any;
    }
    this.meta.value = meta;
  }
}
