use sqlx::{sqlite::SqlitePool, Row};
use anyhow::Result;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock};
use tauri::api::path::app_data_dir;
use crate::models::Trade;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new() -> Result<Self> {
        // 首先尝试使用当前目录，这样更简单可靠
        let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        let db_path = current_dir.join("stock_trader.db");
        let database_url = format!("sqlite:{}", db_path.display());

        println!("尝试连接数据库: {}", database_url);

        match SqlitePool::connect(&database_url).await {
            Ok(pool) => {
                println!("数据库连接成功");
                return Ok(Database { pool });
            }
            Err(e) => {
                println!("当前目录数据库连接失败: {}, 尝试应用数据目录", e);
            }
        }

        // 如果当前目录失败，尝试应用数据目录
        if let Some(mut app_data_path) = app_data_dir(&tauri::Config::default()) {
            app_data_path = app_data_path.join("stock-trader");
            println!("尝试应用数据目录: {:?}", app_data_path);

            if let Ok(_) = std::fs::create_dir_all(&app_data_path) {
                let db_path = app_data_path.join("stock_trader.db");
                let database_url = format!("sqlite:{}", db_path.display());
                println!("连接应用数据目录数据库: {}", database_url);

                match SqlitePool::connect(&database_url).await {
                    Ok(pool) => {
                        println!("应用数据目录数据库连接成功");
                        return Ok(Database { pool });
                    }
                    Err(e) => {
                        println!("应用数据目录数据库连接失败: {}", e);
                    }
                }
            }
        }

        // 最后尝试内存数据库
        println!("尝试使用内存数据库");
        let database_url = "sqlite::memory:";
        let pool = SqlitePool::connect(database_url).await?;
        println!("内存数据库连接成功");

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

// 使用线程安全的全局数据库实例
static DATABASE: OnceLock<Arc<Mutex<Database>>> = OnceLock::new();

pub async fn init_database() -> Result<()> {
    println!("开始初始化数据库...");

    match Database::new().await {
        Ok(db) => {
            println!("数据库连接成功");

            match db.init_tables().await {
                Ok(_) => {
                    println!("数据库表初始化成功");

                    // 线程安全地设置全局数据库实例
                    let db_arc = Arc::new(Mutex::new(db));
                    if DATABASE.set(db_arc).is_err() {
                        return Err(anyhow::anyhow!("数据库已经初始化"));
                    }

                    println!("数据库初始化完成");
                    Ok(())
                }
                Err(e) => {
                    println!("数据库表初始化失败: {}", e);
                    Err(e)
                }
            }
        }
        Err(e) => {
            println!("数据库连接失败: {}", e);
            Err(e)
        }
    }
}

pub fn get_database() -> Arc<Mutex<Database>> {
    DATABASE
        .get()
        .expect("数据库未初始化")
        .clone()
}
