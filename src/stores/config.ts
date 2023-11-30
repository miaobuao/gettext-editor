import { defineStore } from 'pinia';

const useConfig = defineStore('config', () => {
  return {
    visitIndexTime: 0,
    lastOpenedDir: undefined as string | undefined,
  };
});

export default useConfig;
