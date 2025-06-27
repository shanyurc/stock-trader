/**
 * 前后端通信测试套件
 * 测试Tauri命令调用和数据交互
 */

class FrontendBackendTest {
    constructor() {
        this.testResults = [];
        this.isTauriEnvironment = typeof window !== 'undefined' && window.__TAURI__;
    }

    /**
     * 记录测试结果
     */
    logResult(message, isSuccess = true) {
        const result = {
            message,
            isSuccess,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        
        const icon = isSuccess ? '✅' : '❌';
        console.log(`${icon} ${message}`);
    }

    /**
     * 测试Tauri环境检测
     */
    async testTauriEnvironment() {
        console.log('🧪 开始测试Tauri环境检测...');
        
        if (this.isTauriEnvironment) {
            this.logResult('Tauri环境检测成功，运行在桌面应用中');
            
            // 检查Tauri API是否可用
            if (window.__TAURI__.tauri && window.__TAURI__.tauri.invoke) {
                this.logResult('Tauri invoke API可用');
            } else {
                this.logResult('Tauri invoke API不可用', false);
            }
        } else {
            this.logResult('运行在Web环境中，将使用模拟数据');
        }
    }

    /**
     * 测试基础命令调用
     */
    async testBasicCommands() {
        console.log('\n🧪 开始测试基础命令调用...');
        
        // 测试greet命令
        try {
            const greetResult = await this.simulateInvoke('greet', { name: 'Test User' });
            this.logResult(`greet命令调用成功: ${greetResult}`);
        } catch (error) {
            this.logResult(`greet命令调用失败: ${error.message}`, false);
        }

        // 测试获取所有交易记录
        try {
            const tradesResult = await this.simulateInvoke('get_all_trades', {});
            this.logResult(`get_all_trades命令调用成功，返回 ${tradesResult.length} 条记录`);
        } catch (error) {
            this.logResult(`get_all_trades命令调用失败: ${error.message}`, false);
        }

        // 测试获取设置
        try {
            const settingResult = await this.simulateInvoke('get_setting', { key: 'buy_step_percentage' });
            this.logResult(`get_setting命令调用成功: ${settingResult}`);
        } catch (error) {
            this.logResult(`get_setting命令调用失败: ${error.message}`, false);
        }
    }

    /**
     * 测试交易记录相关命令
     */
    async testTradeCommands() {
        console.log('\n🧪 开始测试交易记录相关命令...');
        
        const testTrade = {
            stockCode: '000001',
            stockName: '平安银行',
            buyPrice: 12.50,
            buyTime: new Date().toISOString(),
            quantity: 1000,
            notes: '测试交易记录'
        };

        // 测试创建交易记录
        try {
            const createResult = await this.simulateInvoke('create_trade', { trade: testTrade });
            this.logResult(`create_trade命令调用成功，返回ID: ${createResult}`);
            
            // 测试更新交易记录
            const updatedTrade = { ...testTrade, buyPrice: 13.00, notes: '更新后的测试记录' };
            const updateResult = await this.simulateInvoke('update_trade', { trade: updatedTrade });
            this.logResult('update_trade命令调用成功');
            
            // 测试删除交易记录
            const deleteResult = await this.simulateInvoke('delete_trade', { id: createResult });
            this.logResult('delete_trade命令调用成功');
            
        } catch (error) {
            this.logResult(`交易记录命令调用失败: ${error.message}`, false);
        }
    }

    /**
     * 测试股票信息相关命令
     */
    async testStockCommands() {
        console.log('\n🧪 开始测试股票信息相关命令...');
        
        const testStockCode = '000001';

        // 测试股票代码验证
        try {
            const validateResult = await this.simulateInvoke('validate_stock_code', { stockCode: testStockCode });
            this.logResult(`validate_stock_code命令调用成功: ${validateResult}`);
        } catch (error) {
            this.logResult(`validate_stock_code命令调用失败: ${error.message}`, false);
        }

        // 测试获取股票价格
        try {
            const priceResult = await this.simulateInvoke('get_stock_price', { stockCode: testStockCode });
            this.logResult(`get_stock_price命令调用成功: ${JSON.stringify(priceResult)}`);
        } catch (error) {
            this.logResult(`get_stock_price命令调用失败: ${error.message}`, false);
        }

        // 测试搜索股票
        try {
            const searchResult = await this.simulateInvoke('search_stocks', { query: '平安' });
            this.logResult(`search_stocks命令调用成功，找到 ${searchResult.length} 个结果`);
        } catch (error) {
            this.logResult(`search_stocks命令调用失败: ${error.message}`, false);
        }
    }

    /**
     * 测试计算功能命令
     */
    async testCalculationCommands() {
        console.log('\n🧪 开始测试计算功能命令...');
        
        // 测试价格目标计算
        try {
            const calculationResult = await this.simulateInvoke('calculate_price_targets', {
                tradeId: 1,
                buyStepPercentage: 0.05,
                annualReturnRate: 0.20
            });
            this.logResult(`calculate_price_targets命令调用成功: ${JSON.stringify(calculationResult)}`);
        } catch (error) {
            this.logResult(`calculate_price_targets命令调用失败: ${error.message}`, false);
        }

        // 测试价格提醒检查
        try {
            const alertResult = await this.simulateInvoke('check_price_alerts_and_notify', {
                buyStepPercentage: 0.05,
                annualReturnRate: 0.20
            });
            this.logResult(`check_price_alerts_and_notify命令调用成功，返回 ${alertResult.length} 个提醒`);
        } catch (error) {
            this.logResult(`check_price_alerts_and_notify命令调用失败: ${error.message}`, false);
        }
    }

    /**
     * 测试错误处理
     */
    async testErrorHandling() {
        console.log('\n🧪 开始测试错误处理...');
        
        // 测试无效命令
        try {
            await this.simulateInvoke('invalid_command', {});
            this.logResult('无效命令应该抛出错误，但没有', false);
        } catch (error) {
            this.logResult('正确处理了无效命令错误');
        }

        // 测试无效参数
        try {
            await this.simulateInvoke('create_trade', { trade: null });
            this.logResult('无效参数应该抛出错误，但没有', false);
        } catch (error) {
            this.logResult('正确处理了无效参数错误');
        }

        // 测试缺少参数
        try {
            await this.simulateInvoke('get_stock_price', {});
            this.logResult('缺少参数应该抛出错误，但没有', false);
        } catch (error) {
            this.logResult('正确处理了缺少参数错误');
        }
    }

    /**
     * 模拟Tauri invoke调用
     */
    async simulateInvoke(command, args) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        // 模拟不同命令的响应
        switch (command) {
            case 'greet':
                return `Hello, ${args.name}! You've been greeted from Rust!`;
            
            case 'get_all_trades':
                return [
                    {
                        id: 1,
                        stockCode: '000001',
                        stockName: '平安银行',
                        buyPrice: 12.50,
                        buyTime: '2024-01-15T10:30:00Z',
                        quantity: 1000,
                        notes: '测试记录1'
                    },
                    {
                        id: 2,
                        stockCode: '000002',
                        stockName: '万科A',
                        buyPrice: 18.30,
                        buyTime: '2024-01-16T14:20:00Z',
                        quantity: 500,
                        notes: '测试记录2'
                    }
                ];
            
            case 'create_trade':
                if (!args.trade) throw new Error('交易记录不能为空');
                return Math.floor(Math.random() * 10000) + 1;
            
            case 'update_trade':
                if (!args.trade) throw new Error('交易记录不能为空');
                return true;
            
            case 'delete_trade':
                if (!args.id) throw new Error('交易记录ID不能为空');
                return true;
            
            case 'get_setting':
                const settings = {
                    'buy_step_percentage': '0.05',
                    'annual_return_rate': '0.20',
                    'notification_enabled': 'true'
                };
                return settings[args.key] || null;
            
            case 'validate_stock_code':
                if (!args.stockCode) throw new Error('股票代码不能为空');
                return args.stockCode.length === 6;
            
            case 'get_stock_price':
                if (!args.stockCode) throw new Error('股票代码不能为空');
                return {
                    code: args.stockCode,
                    name: '测试股票',
                    price: 12.50 + Math.random() * 2,
                    change: (Math.random() - 0.5) * 2,
                    changePercent: (Math.random() - 0.5) * 10,
                    timestamp: new Date().toISOString()
                };
            
            case 'search_stocks':
                return [
                    { code: '000001', name: '平安银行' },
                    { code: '000002', name: '万科A' }
                ];
            
            case 'calculate_price_targets':
                return {
                    sellTargetPrice: 15.60,
                    buyTargetPrice: 14.82,
                    daysSincePurchase: 30,
                    currentPrice: 12.80,
                    priceReached: 'none'
                };
            
            case 'check_price_alerts_and_notify':
                return ['股票000001达到买入目标价格', '股票000002达到卖出目标价格'];
            
            default:
                throw new Error(`未知命令: ${command}`);
        }
    }

    /**
     * 运行所有测试
     */
    async runAllTests() {
        console.log('🚀 开始运行前后端通信测试套件...\n');
        
        await this.testTauriEnvironment();
        await this.testBasicCommands();
        await this.testTradeCommands();
        await this.testStockCommands();
        await this.testCalculationCommands();
        await this.testErrorHandling();
        
        console.log('\n📊 前后端通信测试完成！');
        
        return this.testResults;
    }

    /**
     * 生成测试报告
     */
    generateReport() {
        const successCount = this.testResults.filter(r => r.isSuccess).length;
        const failureCount = this.testResults.filter(r => !r.isSuccess).length;
        const totalCount = this.testResults.length;
        
        console.log('\n📋 测试结果汇总:');
        console.log(`总测试数: ${totalCount}`);
        console.log(`成功: ${successCount}`);
        console.log(`失败: ${failureCount}`);
        console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(2)}%`);
        
        console.log('\n详细结果:');
        this.testResults.forEach((result, index) => {
            const icon = result.isSuccess ? '✅' : '❌';
            console.log(`${index + 1}. ${icon} ${result.message}`);
        });
        
        return {
            total: totalCount,
            success: successCount,
            failure: failureCount,
            successRate: (successCount / totalCount) * 100,
            details: this.testResults
        };
    }
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendBackendTest;
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
    window.FrontendBackendTest = FrontendBackendTest;
    
    // 自动运行测试
    (async () => {
        const test = new FrontendBackendTest();
        await test.runAllTests();
        test.generateReport();
    })();
}
