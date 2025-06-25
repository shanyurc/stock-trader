use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Trade {
    pub id: Option<i64>,
    pub stock_code: String,
    pub stock_name: String,
    pub buy_price: f64,
    pub buy_time: DateTime<Utc>,
    pub quantity: i32,
    pub notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Stock {
    pub code: String,
    pub name: String,
    pub current_price: Option<f64>,
    pub last_updated: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Settings {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriceCalculation {
    pub sell_target_price: f64,
    pub buy_target_price: f64,
    pub days_since_purchase: i64,
    pub current_price: Option<f64>,
    pub price_reached: String, // "sell", "buy", "none"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockPriceResponse {
    pub code: String,
    pub name: String,
    pub price: f64,
    pub change: f64,
    pub change_percent: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockSearchResult {
    pub code: String,
    pub name: String,
    pub market: String,
    #[serde(rename = "type")]
    pub stock_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockInfo {
    pub code: String,
    pub name: String,
    pub current_price: f64,
    pub change: f64,
    pub change_percent: f64,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub volume: i64,
    pub turnover: i64,
    pub timestamp: DateTime<Utc>,
}
