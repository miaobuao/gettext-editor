<template></template>

<script setup lang="ts">
import { invoke, fs, dialog, process } from '@tauri-apps/api';
import { isNil } from 'lodash';

invoke<string>('get_input_path').then(async (path) => {
  if (await fs.exists(path)) {
    if (await invoke('is_dir', { path })) {
      const entires = await fs
        .readDir(path)
        .then((files) => files.filter((file) => file.name?.endsWith('.pot')));
      if (entires.length === 1) {
        routerToEditor(entires[0].path);
      } else {
        const file = await selectSingleFile(path);
        if (file) routerToEditor(file);
      }
    } else {
      routerToEditor(path);
      return;
    }
  } else {
    const file = await selectSingleFile();
    if (file) routerToEditor(file);
  }
});

const router = useRouter();
function routerToEditor(path: string) {
  if (!path.endsWith('.pot')) return;
  console.log('goto');

  router.push({
    name: 'editor',
    query: {
      path,
    },
  });
}
</script>
