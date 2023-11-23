<template>
  <v-navigation-drawer permanent :width="150">
    <v-list-item :title="project?.name"> </v-list-item>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="locale in project?.locales"
        prepend-icon="mdi-translate"
        :title="locale.name"
        :value="locale.name"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-main>{{ project }}</v-main>
</template>

<script setup lang="ts">
import { dirname, basename, extname } from 'path-browserify';
import { invoke, fs } from '@tauri-apps/api';
import type { Project } from '~/utils/langs';

const project = ref<Project>();

invoke<string[]>('get_argv').then((data) => {
  if (data.length === 2) {
    const potPath = data[1].trim();
    if (potPath) {
      parsePot(potPath);
      return;
    }
  }
  invoke<string>('get_cwd').then((cwd) => {
    fs.readDir(dirname(cwd)).then((files) => {
      const potPath = files.find((f) => f.name?.endsWith('.pot'))?.path;
      if (potPath) {
        parsePot(potPath);
      }
    });
  });
});

function parsePot(path: string) {
  fs.readTextFile(path).then((text) => {
    const msgs = gettextMsgsParser(text);
    if (msgs === undefined) {
      return;
    }
    project.value = {
      name: basename(path, extname(path)),
      path,
      template: msgs,
      locales: {},
    };
  });
}
</script>
