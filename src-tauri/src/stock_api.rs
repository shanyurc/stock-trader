use crate::models::{StockSearchResult, StockInfo};
use anyhow::Result;

pub struct StockApi;

impl StockApi {
    /// 搜索股票
    pub async fn search_stocks(query: &str) -> Result<Vec<StockSearchResult>> {
        // 尝试从真实API搜索股票
        match Self::fetch_real_stock_search(query).await {
            Ok(results) => {
                if !results.is_empty() {
                    Ok(results)
                } else {
                    // 如果真实API没有结果，使用模拟数据
                    Self::get_mock_stock_search(query)
                }
            }
            Err(e) => {
                println!("真实股票搜索失败，使用模拟数据: {}", e);
                // 如果API调用失败，回退到模拟数据
                Self::get_mock_stock_search(query)
            }
        }
    }

    /// 从真实API搜索股票
    async fn fetch_real_stock_search(query: &str) -> Result<Vec<StockSearchResult>> {
        // 使用东方财富的搜索API
        let url = format!(
            "https://searchapi.eastmoney.com/api/suggest/get?input={}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&markettype=&mktnum=&jys=&classify=&securitytype=&status=&letter=",
            urlencoding::encode(query)
        );

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build()?;

        let response = client.get(&url).send().await?;
        let json: serde_json::Value = response.json().await?;

        let mut results = Vec::new();

        if let Some(quote_data) = json.get("QuotationCodeTable").and_then(|v| v.get("Data")) {
            if let Some(data_array) = quote_data.as_array() {
                for item in data_array.iter().take(10) {
                    if let (Some(code), Some(name), Some(market_code)) = (
                        item.get("Code").and_then(|v| v.as_str()),
                        item.get("Name").and_then(|v| v.as_str()),
                        item.get("MktNum").and_then(|v| v.as_str()),
                    ) {
                        let market = match market_code {
                            "1" => "SH",
                            "2" => "SZ",
                            _ => "OTHER",
                        };

                        results.push(StockSearchResult {
                            code: code.to_string(),
                            name: name.to_string(),
                            market: market.to_string(),
                            stock_type: Some("股票".to_string()),
                        });
                    }
                }
            }
        }

        Ok(results)
    }

    /// 获取模拟股票搜索结果
    fn get_mock_stock_search(query: &str) -> Result<Vec<StockSearchResult>> {
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
        // 尝试从新浪财经API获取真实股票信息
        match Self::fetch_real_stock_info(stock_code).await {
            Ok(stock_info) => Ok(stock_info),
            Err(e) => {
                println!("获取真实股票信息失败，使用模拟数据: {}", e);
                // 如果API调用失败，回退到模拟数据
                Self::get_mock_stock_info(stock_code)
            }
        }
    }

    /// 从新浪财经API获取真实股票信息
    async fn fetch_real_stock_info(stock_code: &str) -> Result<StockInfo> {
        let formatted_code = Self::format_stock_code_for_sina(stock_code);
        let url = format!("https://hq.sinajs.cn/list={}", formatted_code);

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build()?;

        let response = client.get(&url).send().await?;
        let text = response.text().await?;

        // 解析新浪财经返回的数据
        // 格式: var hq_str_sh000001="股票名称,今开,昨收,现价,最高,最低,买一,卖一,成交量,成交额,..."
        if let Some(data_start) = text.find('"') {
            if let Some(data_end) = text.rfind('"') {
                let data = &text[data_start + 1..data_end];
                let parts: Vec<&str> = data.split(',').collect();

                if parts.len() >= 10 {
                    let name = parts[0].to_string();
                    let open: f64 = parts[1].parse().unwrap_or(0.0);
                    let prev_close: f64 = parts[2].parse().unwrap_or(0.0);
                    let current_price: f64 = parts[3].parse().unwrap_or(0.0);
                    let high: f64 = parts[4].parse().unwrap_or(0.0);
                    let low: f64 = parts[5].parse().unwrap_or(0.0);
                    let volume: i64 = parts[8].parse().unwrap_or(0);
                    let turnover: i64 = parts[9].parse::<f64>().unwrap_or(0.0) as i64;

                    let change = current_price - prev_close;
                    let change_percent = if prev_close > 0.0 {
                        (change / prev_close) * 100.0
                    } else {
                        0.0
                    };

                    if current_price > 0.0 && !name.is_empty() {
                        return Ok(StockInfo {
                            code: stock_code.to_string(),
                            name,
                            current_price,
                            change,
                            change_percent,
                            open,
                            high,
                            low,
                            volume,
                            turnover,
                            timestamp: chrono::Utc::now(),
                        });
                    }
                }
            }
        }

        Err(anyhow::anyhow!("无法解析股票信息"))
    }

    /// 获取模拟股票信息（作为后备方案）
    fn get_mock_stock_info(stock_code: &str) -> Result<StockInfo> {
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
        // 尝试从新浪财经API获取真实股价
        match Self::fetch_real_stock_price(stock_code).await {
            Ok(price) => Ok(price),
            Err(e) => {
                println!("获取真实股价失败，使用模拟数据: {}", e);
                // 如果API调用失败，回退到模拟数据
                Self::get_mock_stock_price(stock_code)
            }
        }
    }

    /// 从新浪财经API获取真实股价
    async fn fetch_real_stock_price(stock_code: &str) -> Result<f64> {
        // 构建新浪财经API URL
        let formatted_code = Self::format_stock_code_for_sina(stock_code);
        let url = format!("https://hq.sinajs.cn/list={}", formatted_code);

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
                    let current_price: f64 = parts[3].parse()
                        .map_err(|_| anyhow::anyhow!("无法解析股价数据"))?;

                    if current_price > 0.0 {
                        return Ok(current_price);
                    }
                }
            }
        }

        Err(anyhow::anyhow!("无法解析股价数据"))
    }

    /// 格式化股票代码为新浪财经API格式
    fn format_stock_code_for_sina(stock_code: &str) -> String {
        if stock_code.starts_with("6") {
            format!("sh{}", stock_code) // 上海交易所
        } else if stock_code.starts_with("0") || stock_code.starts_with("3") {
            format!("sz{}", stock_code) // 深圳交易所
        } else {
            format!("sh{}", stock_code) // 默认上海交易所
        }
    }

    /// 获取模拟股价（作为后备方案）
    fn get_mock_stock_price(stock_code: &str) -> Result<f64> {
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
