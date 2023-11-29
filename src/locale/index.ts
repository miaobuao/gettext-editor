import { createI18n } from 'vue-i18n';
import { zh } from './lang/zh';
import { en } from './lang/en';
import { Language, currentLocale, DEFAULT_LOCALE } from './utils';
export * from './utils';

const i18n = createI18n({
  legacy: false,
  locale: currentLocale.value,
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
});

export { i18n };

const locale = i18n.global;
export default locale;

export const switchLanguage = (language?: Language) => {
  currentLocale.value = language ?? DEFAULT_LOCALE;
  i18n.global.locale = currentLocale.value;
};
