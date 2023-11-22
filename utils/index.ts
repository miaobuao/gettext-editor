import type { Msg } from '~/utils/gettext';

export * from '~/utils/gettext';

export interface Project {
  name: string;
  path: string;
  locales: Record<string, Locale>;
  template: Msg[];
}

export interface Locale {
  path: string;
  name: string;
  msgs: Msg[];
}
