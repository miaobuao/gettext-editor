#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let input = env::args().nth(1);
    match input {
        Some(input) => assert!(Path::new(&input).exists()),
        None => {}
    }
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_cwd, get_argv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_cwd() -> String {
    env::current_dir().unwrap().to_str().unwrap().to_string()
}

#[tauri::command]
fn get_argv() -> Vec<String> {
    env::args().collect::<Vec<String>>()
}
