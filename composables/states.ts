import type { Gettext, Msg } from '~/utils/gettext.ts';

export const useGettext = () => useState<Gettext | void>('gettext', () => {});

export const useProject = () =>
  useState('project', () => {
    return {
      name: '',
      path: '',
    };
  });

export const useLocales = () =>
  useState<Map<string, Locale>>('locales', () => new Map());

export interface Locale {
  path: string;
  code: string; // country code
  msgs: Msg[];
}
