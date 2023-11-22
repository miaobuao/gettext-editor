#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

fn main() {
  let cwd  = env::current_dir().unwrap().to_str().unwrap().to_string();
  dbg!(cwd);
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
