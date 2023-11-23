import { Gettext, type Msg } from '~/utils/gettext.js';

export const useGettext = () =>
  useState<Gettext>(
    'gettext',
    () =>
      new Gettext('', {
        msg: [],
        id: new Map(),
      })
  );

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
