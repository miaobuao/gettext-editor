import { dialog } from '@tauri-apps/api';
import { getCwd } from './invoke';

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

export async function selectSingleDir(defaultPath?: string) {
  defaultPath = defaultPath ?? (await getCwd());
  const dir = await dialog.open({
    defaultPath,
    directory: true,
    multiple: false,
  });
  return dir as string | undefined;
}
