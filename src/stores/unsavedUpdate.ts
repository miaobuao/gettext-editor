import { defineStore } from 'pinia';

export default defineStore('unsaved-update', () => {
  return {
    value: new Map<string, Map<string, string>>(),
  };
});
