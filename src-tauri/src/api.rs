use anyhow::Result;
use chrono::Utc;
use crate::models::StockPriceResponse;

pub struct StockApi;

impl StockApi {
    /// 从新浪财经API获取股价
    pub async fn get_stock_price(stock_code: &str) -> Result<StockPriceResponse> {
        let url = format!("https://hq.sinajs.cn/list={}", stock_code);

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build()?;

        let response = client.get(&url).send().await?;
        let text = response.text().await?;
        
        // 解析新浪财经返回的数据
        // 格式: var hq_str_sh000001="上证指数,3000.00,2990.00,3010.00,3020.00,2980.00,..."
        if let Some(data_start) = text.find('"') {
            if let Some(data_end) = text.rfind('"') {
                let data = &text[data_start + 1..data_end];
                let parts: Vec<&str> = data.split(',').collect();
                
                if parts.len() >= 4 {
                    let name = parts[0].to_string();
                    let current_price: f64 = parts[3].parse().unwrap_or(0.0);
                    let prev_close: f64 = parts[2].parse().unwrap_or(0.0);
                    
                    let change = current_price - prev_close;
                    let change_percent = if prev_close > 0.0 {
                        (change / prev_close) * 100.0
                    } else {
                        0.0
                    };
                    
                    return Ok(StockPriceResponse {
                        code: stock_code.to_string(),
                        name,
                        price: current_price,
                        change,
                        change_percent,
                        timestamp: Utc::now(),
                    });
                }
            }
        }
        
        Err(anyhow::anyhow!("无法解析股价数据"))
    }
    
    /// 验证股票代码是否有效
    pub async fn validate_stock_code(stock_code: &str) -> Result<bool> {
        match Self::get_stock_price(stock_code).await {
            Ok(response) => Ok(response.price > 0.0),
            Err(_) => Ok(false),
        }
    }
}

/// 价格计算工具
pub struct PriceCalculator;

impl PriceCalculator {
    /// 计算卖出目标价格
    /// 公式: 买入价格 × (1 + 年化收益率 ÷ 360) × MAX(持有天数, 30)
    pub fn calculate_sell_target_price(
        buy_price: f64,
        annual_return_rate: f64,
        days_held: i64,
    ) -> f64 {
        let effective_days = days_held.max(30) as f64;
        buy_price * (1.0 + (annual_return_rate / 360.0) * effective_days)
    }
    
    /// 计算买入目标价格
    /// 公式: 卖出目标价格 × (1 - 买入台阶)
    pub fn calculate_buy_target_price(
        sell_target_price: f64,
        buy_step_percentage: f64,
    ) -> f64 {
        sell_target_price * (1.0 - buy_step_percentage)
    }
    
    /// 判断当前价格是否达到目标
    pub fn check_price_target(
        current_price: f64,
        sell_target: f64,
        buy_target: f64,
    ) -> String {
        if current_price >= sell_target {
            "sell".to_string()
        } else if current_price <= buy_target {
            "buy".to_string()
        } else {
            "none".to_string()
        }
    }
}
