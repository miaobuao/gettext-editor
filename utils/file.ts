import { invoke, dialog } from '@tauri-apps/api';

interface OpenDialogOptions {
  defaultPath?: string;
  exts?: string[];
}
export async function selectSingleFile({
  defaultPath,
  exts,
}: OpenDialogOptions = {}) {
  defaultPath = defaultPath ?? (await getCwd());
  const file = await dialog.open({
    defaultPath,
    directory: false,
    multiple: false,
    filters: exts ? [{ name: 'Files', extensions: exts }] : undefined,
  });
  return file as string | undefined;
}

export async function selectFiles({
  defaultPath,
  exts,
}: OpenDialogOptions = {}) {
  defaultPath = defaultPath ?? (await getCwd());
  const files = await dialog.open({
    defaultPath,
    multiple: true,
    filters: exts ? [{ name: 'Files', extensions: exts }] : undefined,
  });
  return files as string[] | undefined;
}
