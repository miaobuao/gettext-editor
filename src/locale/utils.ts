export const enum Language {
  en = 'en',
  zh = 'zh',
}

const LOCALSTORAGE_LOCALE = 'locale';
export const DEFAULT_LOCALE = Language.en;

export const currentLocale = useStorage<Language>(
  LOCALSTORAGE_LOCALE,
  DEFAULT_LOCALE
);
