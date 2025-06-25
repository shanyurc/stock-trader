use tauri::command;
use crate::database::get_database;
use crate::models::{Trade, PriceCalculation};
use crate::api::PriceCalculator;
use crate::stock_api::StockApi;
use chrono::Utc;
use anyhow::Result;

#[command]
pub async fn create_trade(trade: Trade) -> Result<i64, String> {
    get_database()
        .create_trade(&trade)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn get_all_trades() -> Result<Vec<Trade>, String> {
    get_database()
        .get_all_trades()
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_trade(trade: Trade) -> Result<(), String> {
    get_database()
        .update_trade(&trade)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_trade(id: i64) -> Result<(), String> {
    get_database()
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
    
    // 获取交易记录
    let trades = db.get_all_trades().await.map_err(|e| e.to_string())?;
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
    get_database()
        .get_setting(&key)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn set_setting(key: String, value: String) -> Result<(), String> {
    get_database()
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
