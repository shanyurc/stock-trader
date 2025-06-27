use std::time::Duration;
use tokio::time::sleep;

/// 价格计算测试数据
#[derive(Debug, Clone)]
struct TestTradeData {
    buy_price: f64,
    days_held: i64,
    quantity: i32,
    stock_code: String,
}

impl TestTradeData {
    fn new(buy_price: f64, days_held: i64, quantity: i32, stock_code: &str) -> Self {
        Self {
            buy_price,
            days_held,
            quantity,
            stock_code: stock_code.to_string(),
        }
    }
}

/// 计算功能测试套件
pub struct CalculationTest {
    test_data: Vec<TestTradeData>,
}

impl CalculationTest {
    pub fn new() -> Self {
        let test_data = vec![
            TestTradeData::new(10.00, 30, 1000, "000001"),   // 最小持有天数
            TestTradeData::new(15.50, 60, 500, "000002"),    // 中等持有天数
            TestTradeData::new(25.80, 120, 200, "600036"),   // 长期持有
            TestTradeData::new(100.00, 15, 100, "600519"),   // 短期持有（小于30天）
            TestTradeData::new(8.30, 365, 2000, "000858"),   // 一年持有
        ];

        Self { test_data }
    }

    /// 测试卖出目标价格计算
    pub async fn test_sell_target_calculation(&self) -> Result<Vec<String>, String> {
        let mut results = Vec::new();
        
        println!("🧪 开始测试卖出目标价格计算...");
        
        let annual_return_rate = 0.20; // 20%年化收益率
        
        for (index, trade) in self.test_data.iter().enumerate() {
            let test_name = format!("卖出目标计算 #{} - {}", index + 1, trade.stock_code);
            
            let result = self.calculate_sell_target(
                trade.buy_price,
                annual_return_rate,
                trade.days_held,
            ).await;
            
            match result {
                Ok(sell_target) => {
                    let expected = self.expected_sell_target(trade.buy_price, annual_return_rate, trade.days_held);
                    let diff = (sell_target - expected).abs();
                    
                    if diff < 0.01 { // 允许0.01的误差
                        let success_msg = format!(
                            "✅ {}: 买入价 {:.2}, 持有{}天, 卖出目标 {:.2}",
                            test_name, trade.buy_price, trade.days_held, sell_target
                        );
                        println!("{}", success_msg);
                        results.push(success_msg);
                    } else {
                        let error_msg = format!(
                            "❌ {}: 计算错误 - 期望 {:.2}, 实际 {:.2}",
                            test_name, expected, sell_target
                        );
                        println!("{}", error_msg);
                        results.push(error_msg);
                    }
                }
                Err(error) => {
                    let error_msg = format!("❌ {}: 计算失败 - {}", test_name, error);
                    println!("{}", error_msg);
                    results.push(error_msg);
                }
            }
            
            sleep(Duration::from_millis(50)).await;
        }
        
        Ok(results)
    }

    /// 计算卖出目标价格
    async fn calculate_sell_target(&self, buy_price: f64, annual_return_rate: f64, days_held: i64) -> Result<f64, String> {
        if buy_price <= 0.0 {
            return Err("买入价格必须大于0".to_string());
        }
        
        if annual_return_rate < 0.0 {
            return Err("年化收益率不能为负数".to_string());
        }
        
        let effective_days = days_held.max(30) as f64;
        let sell_target = buy_price * (1.0 + (annual_return_rate / 360.0) * effective_days);
        
        Ok(sell_target)
    }

    /// 期望的卖出目标价格（用于验证）
    fn expected_sell_target(&self, buy_price: f64, annual_return_rate: f64, days_held: i64) -> f64 {
        let effective_days = days_held.max(30) as f64;
        buy_price * (1.0 + (annual_return_rate / 360.0) * effective_days)
    }

    /// 测试买入目标价格计算
    pub async fn test_buy_target_calculation(&self) -> Result<Vec<String>, String> {
        let mut results = Vec::new();
        
        println!("🧪 开始测试买入目标价格计算...");
        
        let annual_return_rate = 0.20;
        let buy_step_percentage = 0.05; // 5%买入台阶
        
        for (index, trade) in self.test_data.iter().enumerate() {
            let test_name = format!("买入目标计算 #{} - {}", index + 1, trade.stock_code);
            
            // 先计算卖出目标
            let sell_target = self.calculate_sell_target(
                trade.buy_price,
                annual_return_rate,
                trade.days_held,
            ).await?;
            
            // 再计算买入目标
            let result = self.calculate_buy_target(sell_target, buy_step_percentage).await;
            
            match result {
                Ok(buy_target) => {
                    let expected = sell_target * (1.0 - buy_step_percentage);
                    let diff = (buy_target - expected).abs();
                    
                    if diff < 0.01 {
                        let success_msg = format!(
                            "✅ {}: 卖出目标 {:.2}, 买入目标 {:.2} (台阶 {:.1}%)",
                            test_name, sell_target, buy_target, buy_step_percentage * 100.0
                        );
                        println!("{}", success_msg);
                        results.push(success_msg);
                    } else {
                        let error_msg = format!(
                            "❌ {}: 计算错误 - 期望 {:.2}, 实际 {:.2}",
                            test_name, expected, buy_target
                        );
                        println!("{}", error_msg);
                        results.push(error_msg);
                    }
                }
                Err(error) => {
                    let error_msg = format!("❌ {}: 计算失败 - {}", test_name, error);
                    println!("{}", error_msg);
                    results.push(error_msg);
                }
            }
            
            sleep(Duration::from_millis(50)).await;
        }
        
        Ok(results)
    }

    /// 计算买入目标价格
    async fn calculate_buy_target(&self, sell_target: f64, buy_step_percentage: f64) -> Result<f64, String> {
        if sell_target <= 0.0 {
            return Err("卖出目标价格必须大于0".to_string());
        }
        
        if buy_step_percentage < 0.0 || buy_step_percentage >= 1.0 {
            return Err("买入台阶百分比必须在0-1之间".to_string());
        }
        
        let buy_target = sell_target * (1.0 - buy_step_percentage);
        Ok(buy_target)
    }

    /// 测试价格目标判断
    pub async fn test_price_target_check(&self) -> Result<Vec<String>, String> {
        let mut results = Vec::new();
        
        println!("🧪 开始测试价格目标判断...");
        
        let test_cases = vec![
            (12.00, 15.00, 14.25, "sell"),   // 当前价格达到卖出目标
            (12.00, 15.00, 14.24, "none"),  // 当前价格在目标区间内
            (12.00, 15.00, 11.99, "buy"),   // 当前价格达到买入目标
            (12.00, 15.00, 13.50, "none"),  // 当前价格在中间
        ];
        
        for (index, (current_price, sell_target, buy_target, expected)) in test_cases.iter().enumerate() {
            let test_name = format!("价格判断 #{}", index + 1);
            
            let result = self.check_price_target(*current_price, *sell_target, *buy_target).await;
            
            match result {
                Ok(action) => {
                    if action == *expected {
                        let success_msg = format!(
                            "✅ {}: 当前 {:.2}, 卖出 {:.2}, 买入 {:.2} -> {}",
                            test_name, current_price, sell_target, buy_target, action
                        );
                        println!("{}", success_msg);
                        results.push(success_msg);
                    } else {
                        let error_msg = format!(
                            "❌ {}: 期望 '{}', 实际 '{}'",
                            test_name, expected, action
                        );
                        println!("{}", error_msg);
                        results.push(error_msg);
                    }
                }
                Err(error) => {
                    let error_msg = format!("❌ {}: 判断失败 - {}", test_name, error);
                    println!("{}", error_msg);
                    results.push(error_msg);
                }
            }
            
            sleep(Duration::from_millis(30)).await;
        }
        
        Ok(results)
    }

    /// 检查价格目标
    async fn check_price_target(&self, current_price: f64, sell_target: f64, buy_target: f64) -> Result<String, String> {
        if current_price <= 0.0 || sell_target <= 0.0 || buy_target <= 0.0 {
            return Err("所有价格必须大于0".to_string());
        }
        
        if current_price >= sell_target {
            Ok("sell".to_string())
        } else if current_price <= buy_target {
            Ok("buy".to_string())
        } else {
            Ok("none".to_string())
        }
    }

    /// 测试盈亏计算
    pub async fn test_profit_loss_calculation(&self) -> Result<Vec<String>, String> {
        let mut results = Vec::new();
        
        println!("🧪 开始测试盈亏计算...");
        
        for (index, trade) in self.test_data.iter().enumerate() {
            let test_name = format!("盈亏计算 #{} - {}", index + 1, trade.stock_code);
            
            // 模拟当前价格（买入价格的90%-110%）
            let current_price = trade.buy_price * (0.9 + 0.2 * (index as f64 / self.test_data.len() as f64));
            
            let result = self.calculate_profit_loss(
                trade.buy_price,
                current_price,
                trade.quantity,
            ).await;
            
            match result {
                Ok((profit_loss, profit_rate)) => {
                    let success_msg = format!(
                        "✅ {}: 买入 {:.2}, 当前 {:.2}, 数量 {}, 盈亏 {:.2} ({:.2}%)",
                        test_name, trade.buy_price, current_price, trade.quantity, profit_loss, profit_rate * 100.0
                    );
                    println!("{}", success_msg);
                    results.push(success_msg);
                }
                Err(error) => {
                    let error_msg = format!("❌ {}: 计算失败 - {}", test_name, error);
                    println!("{}", error_msg);
                    results.push(error_msg);
                }
            }
            
            sleep(Duration::from_millis(40)).await;
        }
        
        Ok(results)
    }

    /// 计算盈亏
    async fn calculate_profit_loss(&self, buy_price: f64, current_price: f64, quantity: i32) -> Result<(f64, f64), String> {
        if buy_price <= 0.0 || current_price <= 0.0 {
            return Err("价格必须大于0".to_string());
        }
        
        if quantity <= 0 {
            return Err("数量必须大于0".to_string());
        }
        
        let profit_loss = (current_price - buy_price) * quantity as f64;
        let profit_rate = (current_price - buy_price) / buy_price;
        
        Ok((profit_loss, profit_rate))
    }

    /// 测试边界条件
    pub async fn test_edge_cases(&self) -> Result<Vec<String>, String> {
        let mut results = Vec::new();
        
        println!("🧪 开始测试边界条件...");
        
        // 测试零值
        let zero_result = self.calculate_sell_target(0.0, 0.20, 30).await;
        if zero_result.is_err() {
            results.push("✅ 正确处理零买入价格".to_string());
        } else {
            results.push("❌ 未正确处理零买入价格".to_string());
        }
        
        // 测试负值
        let negative_result = self.calculate_sell_target(-10.0, 0.20, 30).await;
        if negative_result.is_err() {
            results.push("✅ 正确处理负买入价格".to_string());
        } else {
            results.push("❌ 未正确处理负买入价格".to_string());
        }
        
        // 测试极大值
        let large_result = self.calculate_sell_target(1000000.0, 0.20, 30).await;
        if large_result.is_ok() {
            results.push("✅ 正确处理极大买入价格".to_string());
        } else {
            results.push("❌ 未正确处理极大买入价格".to_string());
        }
        
        // 测试最小持有天数
        let min_days_result = self.calculate_sell_target(10.0, 0.20, 1).await;
        if let Ok(price) = min_days_result {
            let expected = self.expected_sell_target(10.0, 0.20, 30); // 应该使用30天
            if (price - expected).abs() < 0.01 {
                results.push("✅ 正确处理最小持有天数".to_string());
            } else {
                results.push("❌ 未正确处理最小持有天数".to_string());
            }
        }
        
        Ok(results)
    }

    /// 运行所有计算功能测试
    pub async fn run_all_tests(&self) -> Result<Vec<String>, String> {
        let mut all_results = Vec::new();
        
        println!("🚀 开始运行计算功能测试套件...\n");
        
        // 测试卖出目标计算
        let sell_results = self.test_sell_target_calculation().await?;
        all_results.extend(sell_results);
        
        println!();
        
        // 测试买入目标计算
        let buy_results = self.test_buy_target_calculation().await?;
        all_results.extend(buy_results);
        
        println!();
        
        // 测试价格目标判断
        let check_results = self.test_price_target_check().await?;
        all_results.extend(check_results);
        
        println!();
        
        // 测试盈亏计算
        let profit_results = self.test_profit_loss_calculation().await?;
        all_results.extend(profit_results);
        
        println!();
        
        // 测试边界条件
        let edge_results = self.test_edge_cases().await?;
        all_results.extend(edge_results);
        
        println!("\n📊 计算功能测试完成！");
        
        Ok(all_results)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let test_suite = CalculationTest::new();
    let results = test_suite.run_all_tests().await?;
    
    println!("\n📋 测试结果汇总:");
    for (index, result) in results.iter().enumerate() {
        println!("{}. {}", index + 1, result);
    }
    
    Ok(())
}
