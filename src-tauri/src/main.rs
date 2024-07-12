#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use serde_json::Value;
use reqwest::blocking::Client;

#[command]
fn get_data(url: String) -> Result<Value, String> {
    let client = Client::new();
    let response = client.get(&url)
        .send()
        .map_err(|err| err.to_string())?;

    let text = match response.text() {
        Ok(text) => text,
        Err(_) => {
            return Err("Failed to retrieve response body".to_string());
        }
    };

    if let Ok(json) = serde_json::from_str::<Value>(&text) {
        return Ok(json);
    }

    Ok(Value::String(text))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
