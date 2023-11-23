import type { Msg, POTemplate } from '~/utils/gettext.ts';

export const usePOTemplate = () =>
  useState<POTemplate>('template', () => {
    return {
      msg: [],
      id: {},
    };
  });

export const useProject = () =>
  useState('project', () => {
    return {
      name: '',
      path: '',
    };
  });

export const useLocales = () =>
  useState<Record<string, Locale>>('locales', () => ({}));

export interface Locale {
  path: string;
  code: string; // country code
  msgs: Msg[];
}
