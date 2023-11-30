import { defineStore } from 'pinia';
import { Gettext, convertPathToCode } from '../utils/gettext';

export default defineStore('gettext', () => {
  return {
    value: new Gettext('', {
      msg: [],
      id: new Map(),
    }),
    project: {
      name: '',
    },
    set(obj: Gettext) {
      this.value.cloneFrom(obj);
      this.project.name = convertPathToCode(obj.path);
    },
  };
});
