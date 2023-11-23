import { invoke } from '@tauri-apps/api';

export function isDir(path: string) {
  return invoke<boolean>('is_dir', { path });
}

export function getCwd() {
  return invoke<string>('get_cwd');
}

export function getInputPath() {
  return invoke<string | null>('get_input_path');
}
