import { dialog } from '@tauri-apps/api';
import { getCwd } from './invoke';
import useConfig from '../stores/config';
import { isNil } from 'lodash-es';
import { dirname } from 'path-browserify';

interface OpenDialogOptions {
  defaultPath?: string;
  exts?: string[];
}
export async function selectSingleFile({
  defaultPath,
  exts,
}: OpenDialogOptions = {}) {
  const config = useConfig();
  defaultPath = defaultPath ?? config.lastOpenedDir ?? (await getCwd());
  const file = (await dialog.open({
    defaultPath,
    directory: false,
    multiple: false,
    filters: exts ? [{ name: 'Files', extensions: exts }] : undefined,
  })) as string | undefined;
  if (isNil(file)) return undefined;
  config.lastOpenedDir = dirname(file);
  return file;
}

export async function selectFiles({
  defaultPath,
  exts,
}: OpenDialogOptions = {}) {
  const config = useConfig();
  defaultPath = defaultPath ?? config.lastOpenedDir ?? (await getCwd());
  const files = (await dialog.open({
    defaultPath,
    multiple: true,
    filters: exts ? [{ name: 'Files', extensions: exts }] : undefined,
  })) as string[] | undefined;
  if (isNil(files)) return undefined;
  config.lastOpenedDir = dirname(files[0]);
  return files;
}

export async function selectSingleDir(defaultPath?: string) {
  const config = useConfig();
  defaultPath = defaultPath ?? config.lastOpenedDir ?? (await getCwd());
  const dir = (await dialog.open({
    defaultPath,
    directory: true,
    multiple: false,
  })) as string | undefined;
  if (isNil(dir)) return undefined;
  config.lastOpenedDir = dir;
  return dir as string | undefined;
}
