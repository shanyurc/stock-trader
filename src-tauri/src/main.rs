// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod api;
mod models;
mod commands;

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("你好, {}! 欢迎使用trader!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::create_trade,
            commands::get_all_trades,
            commands::update_trade,
            commands::delete_trade,
            commands::get_stock_price,
            commands::validate_stock_code,
            commands::calculate_price_targets,
            commands::get_setting,
            commands::set_setting
        ])
        .setup(|app| {
            // 初始化数据库
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = database::init_database().await {
                    eprintln!("数据库初始化失败: {}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("运行 Tauri 应用程序时出错");
}
