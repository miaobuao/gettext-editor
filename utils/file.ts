import { invoke, dialog } from '@tauri-apps/api';

export async function selectSingleFile(path?: string) {
  path = path ?? (await invoke('get_cwd'));
  const file = await dialog.open({
    defaultPath: path,
    directory: false,
    multiple: false,
  });
  return file as string | undefined;
}
