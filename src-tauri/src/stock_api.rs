use crate::models::{StockSearchResult, StockInfo};
use anyhow::Result;

pub struct StockApi;

impl StockApi {
    /// 搜索股票
    pub async fn search_stocks(query: &str) -> Result<Vec<StockSearchResult>> {
        // 这里实现真实的股票搜索API调用
        // 目前返回模拟数据，后续可以接入真实的股票API
        
        let mock_stocks = vec![
            StockSearchResult {
                code: "000001".to_string(),
                name: "平安银行".to_string(),
                market: "SZ".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "000002".to_string(),
                name: "万科A".to_string(),
                market: "SZ".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "600000".to_string(),
                name: "浦发银行".to_string(),
                market: "SH".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "600036".to_string(),
                name: "招商银行".to_string(),
                market: "SH".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "000858".to_string(),
                name: "五粮液".to_string(),
                market: "SZ".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "600519".to_string(),
                name: "贵州茅台".to_string(),
                market: "SH".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "002415".to_string(),
                name: "海康威视".to_string(),
                market: "SZ".to_string(),
                stock_type: Some("股票".to_string()),
            },
            StockSearchResult {
                code: "600276".to_string(),
                name: "恒瑞医药".to_string(),
                market: "SH".to_string(),
                stock_type: Some("股票".to_string()),
            },
        ];

        // 过滤匹配的股票
        let filtered: Vec<StockSearchResult> = mock_stocks
            .into_iter()
            .filter(|stock| {
                stock.code.contains(query) || 
                stock.name.contains(query)
            })
            .take(10) // 限制返回10个结果
            .collect();

        Ok(filtered)
    }

    /// 获取股票详细信息
    pub async fn get_stock_info(stock_code: &str) -> Result<StockInfo> {
        // 这里实现真实的股票信息API调用
        // 目前返回模拟数据，后续可以接入真实的股票API
        
        let mock_data = match stock_code {
            "000001" => ("平安银行", 12.50, 12.30, 12.80, 12.20),
            "000002" => ("万科A", 8.80, 8.75, 8.95, 8.70),
            "600036" => ("招商银行", 35.20, 35.00, 35.50, 34.80),
            "000858" => ("五粮液", 168.50, 167.20, 170.30, 166.80),
            "600519" => ("贵州茅台", 1680.00, 1675.50, 1695.20, 1670.30),
            "002415" => ("海康威视", 42.30, 42.10, 43.20, 41.80),
            "600276" => ("恒瑞医药", 58.90, 58.50, 59.80, 58.20),
            _ => ("未知股票", 10.0 + (get_random_f64() * 5.0), 10.0, 11.0, 9.5),
        };

        let (name, price, open, high, low) = mock_data;
        let change = -0.5 + (get_random_f64() * 1.0);

        let stock_info = StockInfo {
            code: stock_code.to_string(),
            name: name.to_string(),
            current_price: price,
            change,
            change_percent: (change / price) * 100.0,
            open,
            high,
            low,
            volume: (get_random_f64() * 1000000.0) as i64,
            turnover: (get_random_f64() * 100000000.0) as i64,
            timestamp: chrono::Utc::now(),
        };

        Ok(stock_info)
    }

    /// 验证股票代码格式
    pub fn validate_stock_code(stock_code: &str) -> bool {
        // 简单的股票代码验证
        if stock_code.len() != 6 {
            return false;
        }

        // 检查是否全为数字
        stock_code.chars().all(|c| c.is_ascii_digit())
    }

    /// 获取股票实时价格
    pub async fn get_stock_price(stock_code: &str) -> Result<f64> {
        // 这里实现真实的股票价格API调用
        // 目前返回模拟数据
        
        let base_price = match stock_code {
            "000001" => 12.50,
            "000002" => 8.80,
            "600036" => 35.20,
            "000858" => 168.50,
            "600519" => 1680.00,
            "002415" => 42.30,
            "600276" => 58.90,
            _ => 10.0 + (get_random_f64() * 5.0),
        };

        // 添加一些随机波动
        let fluctuation = (get_random_f64() - 0.5) * 0.1; // ±5%的波动
        let current_price = base_price * (1.0 + fluctuation);

        Ok(current_price)
    }
}

// 简单的随机数生成函数
fn get_random_f64() -> f64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    use std::time::{SystemTime, UNIX_EPOCH};

    let mut hasher = DefaultHasher::new();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    now.hash(&mut hasher);
    let hash = hasher.finish();
    (hash as f64) / (u64::MAX as f64)
}
