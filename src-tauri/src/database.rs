use sqlx::{sqlite::SqlitePool, Row};
use anyhow::Result;
use std::path::PathBuf;
use tauri::api::path::app_data_dir;
use crate::models::{Trade, Stock, Settings};

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new() -> Result<Self> {
        let app_data_path = app_data_dir(&tauri::Config::default())
            .unwrap_or_else(|| PathBuf::from("."));
        
        std::fs::create_dir_all(&app_data_path)?;
        
        let db_path = app_data_path.join("stock_trader.db");
        let database_url = format!("sqlite:{}", db_path.display());
        
        let pool = SqlitePool::connect(&database_url).await?;
        
        Ok(Database { pool })
    }

    pub async fn init_tables(&self) -> Result<()> {
        // 创建交易记录表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stock_code TEXT NOT NULL,
                stock_name TEXT NOT NULL,
                buy_price REAL NOT NULL,
                buy_time DATETIME NOT NULL,
                quantity INTEGER NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // 创建股票信息表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS stocks (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                current_price REAL,
                last_updated DATETIME
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // 创建用户配置表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // 插入默认配置
        self.init_default_settings().await?;

        Ok(())
    }

    async fn init_default_settings(&self) -> Result<()> {
        let default_settings = vec![
            ("buy_step_percentage", "0.05"),  // 5%
            ("annual_return_rate", "0.20"),   // 20%
            ("notification_enabled", "true"),
            ("sound_enabled", "true"),
            ("auto_backup_enabled", "false"),
            ("backup_interval", "24"),        // 24小时
            ("onedrive_enabled", "false"),
            ("webdav_enabled", "false"),
        ];

        for (key, value) in default_settings {
            sqlx::query("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
                .bind(key)
                .bind(value)
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    // 交易记录 CRUD 操作
    pub async fn create_trade(&self, trade: &Trade) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO trades (stock_code, stock_name, buy_price, buy_time, quantity, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&trade.stock_code)
        .bind(&trade.stock_name)
        .bind(trade.buy_price)
        .bind(trade.buy_time)
        .bind(trade.quantity)
        .bind(&trade.notes)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn get_all_trades(&self) -> Result<Vec<Trade>> {
        let trades = sqlx::query_as::<_, Trade>(
            "SELECT id, stock_code, stock_name, buy_price, buy_time, quantity, notes, created_at FROM trades ORDER BY buy_time DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(trades)
    }

    pub async fn update_trade(&self, trade: &Trade) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE trades 
            SET stock_code = ?, stock_name = ?, buy_price = ?, buy_time = ?, quantity = ?, notes = ?
            WHERE id = ?
            "#,
        )
        .bind(&trade.stock_code)
        .bind(&trade.stock_name)
        .bind(trade.buy_price)
        .bind(trade.buy_time)
        .bind(trade.quantity)
        .bind(&trade.notes)
        .bind(trade.id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete_trade(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM trades WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // 股票信息操作
    pub async fn upsert_stock(&self, stock: &Stock) -> Result<()> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO stocks (code, name, current_price, last_updated)
            VALUES (?, ?, ?, ?)
            "#,
        )
        .bind(&stock.code)
        .bind(&stock.name)
        .bind(stock.current_price)
        .bind(stock.last_updated)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_stock(&self, code: &str) -> Result<Option<Stock>> {
        let stock = sqlx::query_as::<_, Stock>(
            "SELECT code, name, current_price, last_updated FROM stocks WHERE code = ?"
        )
        .bind(code)
        .fetch_optional(&self.pool)
        .await?;

        Ok(stock)
    }

    // 配置操作
    pub async fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let row = sqlx::query("SELECT value FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;

        Ok(row.map(|r| r.get("value")))
    }

    pub async fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        sqlx::query("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
            .bind(key)
            .bind(value)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

static mut DATABASE: Option<Database> = None;

pub async fn init_database() -> Result<()> {
    let db = Database::new().await?;
    db.init_tables().await?;
    
    unsafe {
        DATABASE = Some(db);
    }
    
    Ok(())
}

pub fn get_database() -> &'static Database {
    unsafe {
        DATABASE.as_ref().expect("数据库未初始化")
    }
}
