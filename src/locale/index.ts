import { createI18n } from 'vue-i18n';
import { zh } from './lang/zh';
import { en } from './lang/en';
import { Language, currentLocale, DEFAULT_LOCALE } from './utils';
export * from './utils';

const i18nInstance = createI18n({
  legacy: false,
  locale: currentLocale.value,
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
});

export { i18nInstance };

const i18n = i18nInstance.global;
export default i18n;

export const switchLanguage = (language?: Language) => {
  currentLocale.value = language ?? DEFAULT_LOCALE;
  i18nInstance.global.locale = currentLocale.value;
};
