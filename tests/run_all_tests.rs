use std::time::{Duration, Instant};
use tokio::time::sleep;

mod trade_management_test;
mod database_test;
mod calculation_test;

use trade_management_test::TradeManagementTest;
use database_test::DatabaseTest;
use calculation_test::CalculationTest;

/// 测试套件运行器
pub struct TestRunner {
    start_time: Option<Instant>,
    total_tests: usize,
    passed_tests: usize,
    failed_tests: usize,
}

impl TestRunner {
    pub fn new() -> Self {
        Self {
            start_time: None,
            total_tests: 0,
            passed_tests: 0,
            failed_tests: 0,
        }
    }

    /// 开始测试
    pub fn start(&mut self) {
        self.start_time = Some(Instant::now());
        println!("🚀 开始运行股票交易应用完整测试套件");
        println!("=" .repeat(60));
    }

    /// 运行单个测试套件
    async fn run_test_suite<F, Fut>(&mut self, name: &str, test_fn: F) -> Result<Vec<String>, String>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<Vec<String>, String>>,
    {
        println!("\n📋 运行测试套件: {}", name);
        println!("-".repeat(40));
        
        let suite_start = Instant::now();
        let result = test_fn().await;
        let suite_duration = suite_start.elapsed();
        
        match result {
            Ok(results) => {
                let suite_passed = results.iter().filter(|r| r.contains("✅")).count();
                let suite_failed = results.iter().filter(|r| r.contains("❌")).count();
                let suite_total = suite_passed + suite_failed;
                
                self.total_tests += suite_total;
                self.passed_tests += suite_passed;
                self.failed_tests += suite_failed;
                
                println!("\n📊 {} 测试结果:", name);
                println!("  总计: {} | 通过: {} | 失败: {} | 耗时: {:.2}s", 
                    suite_total, suite_passed, suite_failed, suite_duration.as_secs_f64());
                
                if suite_failed > 0 {
                    println!("  ⚠️  发现 {} 个失败的测试", suite_failed);
                }
                
                Ok(results)
            }
            Err(error) => {
                println!("❌ {} 测试套件执行失败: {}", name, error);
                self.failed_tests += 1;
                Err(error)
            }
        }
    }

    /// 运行所有测试
    pub async fn run_all_tests(&mut self) -> Result<(), String> {
        self.start();
        
        let mut all_results = Vec::new();
        
        // 1. 交易记录管理测试
        let trade_test = TradeManagementTest::new();
        let trade_results = self.run_test_suite("交易记录管理", || async {
            trade_test.run_all_tests().await
        }).await;
        
        if let Ok(results) = trade_results {
            all_results.extend(results);
        }
        
        sleep(Duration::from_millis(500)).await;
        
        // 2. 数据库功能测试
        let db_results = self.run_test_suite("数据库功能", || async {
            DatabaseTest::run_all_tests().await
        }).await;
        
        if let Ok(results) = db_results {
            all_results.extend(results);
        }
        
        sleep(Duration::from_millis(500)).await;
        
        // 3. 计算功能测试
        let calc_test = CalculationTest::new();
        let calc_results = self.run_test_suite("计算功能", || async {
            calc_test.run_all_tests().await
        }).await;
        
        if let Ok(results) = calc_results {
            all_results.extend(results);
        }
        
        // 生成最终报告
        self.generate_final_report(&all_results);
        
        Ok(())
    }

    /// 生成最终测试报告
    fn generate_final_report(&self, all_results: &[String]) {
        let total_duration = self.start_time.unwrap().elapsed();
        
        println!("\n");
        println!("=" .repeat(60));
        println!("📊 股票交易应用测试完整报告");
        println!("=" .repeat(60));
        
        // 总体统计
        println!("\n🔢 总体统计:");
        println!("  总测试数量: {}", self.total_tests);
        println!("  通过测试: {} ({}%)", 
            self.passed_tests, 
            if self.total_tests > 0 { (self.passed_tests * 100) / self.total_tests } else { 0 }
        );
        println!("  失败测试: {} ({}%)", 
            self.failed_tests,
            if self.total_tests > 0 { (self.failed_tests * 100) / self.total_tests } else { 0 }
        );
        println!("  总耗时: {:.2} 秒", total_duration.as_secs_f64());
        
        // 测试状态
        if self.failed_tests == 0 {
            println!("\n🎉 所有测试通过！应用功能正常。");
        } else {
            println!("\n⚠️  发现 {} 个问题需要修复。", self.failed_tests);
        }
        
        // 功能覆盖率评估
        self.assess_feature_coverage();
        
        // 详细结果（仅显示失败的测试）
        let failed_results: Vec<&String> = all_results.iter()
            .filter(|r| r.contains("❌"))
            .collect();
        
        if !failed_results.is_empty() {
            println!("\n❌ 失败的测试详情:");
            for (index, result) in failed_results.iter().enumerate() {
                println!("  {}. {}", index + 1, result);
            }
        }
        
        // 建议和下一步
        self.provide_recommendations();
    }

    /// 评估功能覆盖率
    fn assess_feature_coverage(&self) {
        println!("\n📋 功能覆盖率评估:");
        
        let features = vec![
            ("交易记录管理", "✅ 已测试"),
            ("数据库操作", "✅ 已测试"),
            ("价格计算", "✅ 已测试"),
            ("前后端通信", "⚠️  需要在实际环境中测试"),
            ("用户界面", "⚠️  需要在实际环境中测试"),
            ("文件导入导出", "❌ 未测试"),
            ("云备份功能", "❌ 未测试"),
            ("价格提醒", "❌ 未测试"),
            ("股票搜索", "❌ 未测试"),
        ];
        
        for (feature, status) in features {
            println!("  {}: {}", feature, status);
        }
    }

    /// 提供建议和下一步
    fn provide_recommendations(&self) {
        println!("\n💡 建议和下一步:");
        
        if self.failed_tests > 0 {
            println!("  1. 🔧 修复失败的测试中发现的问题");
            println!("  2. 🔄 重新运行测试确保修复有效");
        }
        
        println!("  3. 🌐 在实际Tauri环境中测试前后端通信");
        println!("  4. 🖥️  在桌面应用中测试用户界面");
        println!("  5. 📊 添加更多边界条件和异常情况测试");
        println!("  6. 🔍 进行手动功能测试");
        println!("  7. 📈 测试性能和内存使用情况");
        println!("  8. 🔒 进行安全性测试");
        
        println!("\n🎯 推荐的测试顺序:");
        println!("  1. 先修复当前失败的测试");
        println!("  2. 在Tauri应用中运行前后端通信测试");
        println!("  3. 进行完整的用户界面测试");
        println!("  4. 测试文件操作和云备份功能");
        println!("  5. 进行端到端的集成测试");
    }

    /// 获取测试统计
    pub fn get_stats(&self) -> (usize, usize, usize) {
        (self.total_tests, self.passed_tests, self.failed_tests)
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut runner = TestRunner::new();
    
    match runner.run_all_tests().await {
        Ok(_) => {
            let (total, passed, failed) = runner.get_stats();
            
            if failed == 0 {
                println!("\n🎉 所有测试完成，应用准备就绪！");
                std::process::exit(0);
            } else {
                println!("\n⚠️  测试完成，但发现 {} 个问题需要修复。", failed);
                std::process::exit(1);
            }
        }
        Err(error) => {
            println!("❌ 测试运行失败: {}", error);
            std::process::exit(1);
        }
    }
}
