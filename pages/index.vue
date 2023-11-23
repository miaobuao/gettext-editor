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
        selectFile(path);
      }
    } else {
      routerToEditor(path);
      return;
    }
  } else {
    selectFile();
  }
});

async function selectFile(path?: string) {
  path = path ?? (await invoke('get_cwd'));
  const potPath = await dialog.open({
    defaultPath: path,
    directory: false,
  });
  if (isNil(potPath)) {
    await process.exit(1);
  }
  routerToEditor(potPath as string);
}

const router = useRouter();
function routerToEditor(path: string) {
  if (!path.endsWith('.pot')) return;
  router.push({
    name: 'editor',
    query: {
      path,
    },
  });
}
</script>
