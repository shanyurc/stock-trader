use tauri::{command, api::notification::Notification, Manager};
use crate::database::get_database;
use crate::models::{Trade, PriceCalculation};
use crate::api::PriceCalculator;
use crate::stock_api::StockApi;
use chrono::Utc;
use anyhow::Result;

#[command]
pub async fn create_trade(trade: Trade) -> Result<i64, String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    db_lock
        .create_trade(&trade)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_all_trades() -> Result<Vec<Trade>, String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    db_lock
        .get_all_trades()
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_trade(trade: Trade) -> Result<(), String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    db_lock
        .update_trade(&trade)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_trade(id: i64) -> Result<(), String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    db_lock
        .delete_trade(id)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_stock_price(stock_code: String) -> Result<crate::models::StockPriceResponse, String> {
    match StockApi::get_stock_info(&stock_code).await {
        Ok(stock_info) => {
            Ok(crate::models::StockPriceResponse {
                code: stock_info.code,
                name: stock_info.name,
                price: stock_info.current_price,
                change: stock_info.change,
                change_percent: stock_info.change_percent,
                timestamp: stock_info.timestamp,
            })
        }
        Err(e) => Err(e.to_string())
    }
}

#[command]
pub async fn validate_stock_code(stock_code: String) -> Result<bool, String> {
    Ok(StockApi::validate_stock_code(&stock_code))
}

#[command]
pub async fn calculate_price_targets(
    trade_id: i64,
    buy_step_percentage: f64,
    annual_return_rate: f64,
) -> Result<PriceCalculation, String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;

    // 获取交易记录
    let trades = db_lock.get_all_trades().await.map_err(|e| e.to_string())?;
    let trade = trades
        .into_iter()
        .find(|t| t.id == Some(trade_id))
        .ok_or("交易记录不存在")?;
    
    // 计算持有天数
    let days_held = (Utc::now() - trade.buy_time).num_days();
    
    // 计算目标价格
    let sell_target = PriceCalculator::calculate_sell_target_price(
        trade.buy_price,
        annual_return_rate,
        days_held,
    );
    
    let buy_target = PriceCalculator::calculate_buy_target_price(
        sell_target,
        buy_step_percentage,
    );
    
    // 获取当前股价
    let current_price = match StockApi::get_stock_price(&trade.stock_code).await {
        Ok(price) => Some(price),
        Err(_) => None,
    };
    
    // 判断价格目标
    let price_reached = if let Some(price) = current_price {
        PriceCalculator::check_price_target(price, sell_target, buy_target)
    } else {
        "none".to_string()
    };
    
    Ok(PriceCalculation {
        sell_target_price: sell_target,
        buy_target_price: buy_target,
        days_since_purchase: days_held,
        current_price,
        price_reached,
    })
}

#[command]
pub async fn get_setting(key: String) -> Result<Option<String>, String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    db_lock
        .get_setting(&key)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn set_setting(key: String, value: String) -> Result<(), String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;
    db_lock
        .set_setting(&key, &value)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn search_stocks(query: String) -> Result<Vec<crate::models::StockSearchResult>, String> {
    StockApi::search_stocks(&query)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_stock_info(stock_code: String) -> Result<crate::models::StockInfo, String> {
    StockApi::get_stock_info(&stock_code)
        .await
        .map_err(|e| e.to_string())
}

// 通知相关命令

#[command]
pub async fn send_notification(
    app_handle: tauri::AppHandle,
    title: String,
    body: String,
    icon: Option<String>
) -> Result<(), String> {
    let mut notification = Notification::new(&app_handle.config().tauri.bundle.identifier)
        .title(title)
        .body(body);

    if let Some(icon_path) = icon {
        notification = notification.icon(icon_path);
    }

    notification.show().map_err(|e| e.to_string())
}

#[command]
pub async fn check_price_alerts_and_notify(
    app_handle: tauri::AppHandle,
    buy_step_percentage: f64,
    annual_return_rate: f64,
) -> Result<Vec<String>, String> {
    let db = get_database();
    let db_lock = db.lock().map_err(|e| format!("数据库锁定失败: {}", e))?;

    // 获取所有交易记录
    let trades = db_lock.get_all_trades().await.map_err(|e| e.to_string())?;
    let mut alerts = Vec::new();

    for trade in trades {
        if let Some(trade_id) = trade.id {
            // 计算价格目标
            let days_held = (Utc::now() - trade.buy_time).num_days();
            let sell_target = PriceCalculator::calculate_sell_target_price(
                trade.buy_price,
                annual_return_rate,
                days_held,
            );
            let buy_target = PriceCalculator::calculate_buy_target_price(
                sell_target,
                buy_step_percentage,
            );

            // 获取当前股价
            if let Ok(current_price) = StockApi::get_stock_price(&trade.stock_code).await {
                let price_reached = PriceCalculator::check_price_target(
                    current_price,
                    sell_target,
                    buy_target,
                );

                match price_reached.as_str() {
                    "sell" => {
                        let message = format!(
                            "{}({}) 已达到卖出目标价格 ¥{:.2}，当前价格 ¥{:.2}",
                            trade.stock_name, trade.stock_code, sell_target, current_price
                        );

                        // 发送通知
                        let _ = Notification::new(&app_handle.config().tauri.bundle.identifier)
                            .title("🔔 卖出提醒")
                            .body(&message)
                            .show();

                        alerts.push(message);
                    }
                    "buy" => {
                        let message = format!(
                            "{}({}) 已达到买入目标价格 ¥{:.2}，当前价格 ¥{:.2}",
                            trade.stock_name, trade.stock_code, buy_target, current_price
                        );

                        // 发送通知
                        let _ = Notification::new(&app_handle.config().tauri.bundle.identifier)
                            .title("🔔 买入提醒")
                            .body(&message)
                            .show();

                        alerts.push(message);
                    }
                    _ => {}
                }
            }
        }
    }

    Ok(alerts)
}
