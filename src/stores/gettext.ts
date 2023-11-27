import { defineStore } from 'pinia';
import { Gettext } from '../utils/gettext';

export default defineStore('gettext', () => {
  return {
    value: new Gettext('', {
      msg: [],
      id: new Map(),
    }),
  };
});
