import { defineStore } from 'pinia';

export default defineStore('project', () => {
  return {
    name: '',
    path: '',
    firstOpen: true,
  };
});
