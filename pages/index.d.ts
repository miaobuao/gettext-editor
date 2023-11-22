interface Project {
  name: string;
  path: string;
  locales: Record<string, Locale>;
}

interface Locale {
  path: string;
  name: string;
  msgs: Msg[];
}

interface Msg {
  id: string;
  str: string;
}
