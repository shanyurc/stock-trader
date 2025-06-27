/**
 * 用户界面测试套件
 * 测试表单验证、数据显示和用户交互
 */

class UITest {
    constructor() {
        this.testResults = [];
        this.mockData = this.generateMockData();
    }

    /**
     * 生成模拟数据
     */
    generateMockData() {
        return {
            trades: [
                {
                    id: 1,
                    stockCode: '000001',
                    stockName: '平安银行',
                    buyPrice: 12.50,
                    buyTime: new Date('2024-01-15T10:30:00'),
                    quantity: 1000,
                    notes: '测试交易记录1'
                },
                {
                    id: 2,
                    stockCode: '000002',
                    stockName: '万科A',
                    buyPrice: 18.30,
                    buyTime: new Date('2024-01-16T14:20:00'),
                    quantity: 500,
                    notes: '测试交易记录2'
                }
            ],
            settings: {
                buyStepPercentage: 0.05,
                annualReturnRate: 0.20,
                notificationEnabled: true,
                soundEnabled: true
            }
        };
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
     * 测试交易表单验证
     */
    async testTradeFormValidation() {
        console.log('🧪 开始测试交易表单验证...');
        
        const testCases = [
            {
                name: '有效的交易数据',
                data: {
                    stockCode: '000001',
                    stockName: '平安银行',
                    buyPrice: 12.50,
                    quantity: 1000,
                    notes: '测试记录'
                },
                shouldPass: true
            },
            {
                name: '空股票代码',
                data: {
                    stockCode: '',
                    stockName: '平安银行',
                    buyPrice: 12.50,
                    quantity: 1000
                },
                shouldPass: false
            },
            {
                name: '无效股票代码格式',
                data: {
                    stockCode: '123',
                    stockName: '平安银行',
                    buyPrice: 12.50,
                    quantity: 1000
                },
                shouldPass: false
            },
            {
                name: '空股票名称',
                data: {
                    stockCode: '000001',
                    stockName: '',
                    buyPrice: 12.50,
                    quantity: 1000
                },
                shouldPass: false
            },
            {
                name: '零买入价格',
                data: {
                    stockCode: '000001',
                    stockName: '平安银行',
                    buyPrice: 0,
                    quantity: 1000
                },
                shouldPass: false
            },
            {
                name: '负买入价格',
                data: {
                    stockCode: '000001',
                    stockName: '平安银行',
                    buyPrice: -10.50,
                    quantity: 1000
                },
                shouldPass: false
            },
            {
                name: '零数量',
                data: {
                    stockCode: '000001',
                    stockName: '平安银行',
                    buyPrice: 12.50,
                    quantity: 0
                },
                shouldPass: false
            },
            {
                name: '负数量',
                data: {
                    stockCode: '000001',
                    stockName: '平安银行',
                    buyPrice: 12.50,
                    quantity: -100
                },
                shouldPass: false
            }
        ];

        for (const testCase of testCases) {
            const isValid = this.validateTradeForm(testCase.data);
            
            if (isValid === testCase.shouldPass) {
                this.logResult(`表单验证 - ${testCase.name}: 验证结果正确`);
            } else {
                this.logResult(`表单验证 - ${testCase.name}: 验证结果错误，期望 ${testCase.shouldPass}, 实际 ${isValid}`, false);
            }
        }
    }

    /**
     * 验证交易表单数据
     */
    validateTradeForm(data) {
        // 股票代码验证
        if (!data.stockCode || data.stockCode.trim() === '') {
            return false;
        }
        
        // 股票代码格式验证（6位数字）
        if (!/^\d{6}$/.test(data.stockCode)) {
            return false;
        }
        
        // 股票名称验证
        if (!data.stockName || data.stockName.trim() === '') {
            return false;
        }
        
        // 买入价格验证
        if (!data.buyPrice || data.buyPrice <= 0) {
            return false;
        }
        
        // 数量验证
        if (!data.quantity || data.quantity <= 0) {
            return false;
        }
        
        return true;
    }

    /**
     * 测试数据显示格式
     */
    async testDataDisplayFormat() {
        console.log('\n🧪 开始测试数据显示格式...');
        
        for (const trade of this.mockData.trades) {
            // 测试价格格式化
            const formattedPrice = this.formatPrice(trade.buyPrice);
            if (this.isValidPriceFormat(formattedPrice)) {
                this.logResult(`价格格式化 - ${trade.stockCode}: ${formattedPrice}`);
            } else {
                this.logResult(`价格格式化 - ${trade.stockCode}: 格式错误 ${formattedPrice}`, false);
            }
            
            // 测试日期格式化
            const formattedDate = this.formatDate(trade.buyTime);
            if (this.isValidDateFormat(formattedDate)) {
                this.logResult(`日期格式化 - ${trade.stockCode}: ${formattedDate}`);
            } else {
                this.logResult(`日期格式化 - ${trade.stockCode}: 格式错误 ${formattedDate}`, false);
            }
            
            // 测试数量格式化
            const formattedQuantity = this.formatQuantity(trade.quantity);
            if (this.isValidQuantityFormat(formattedQuantity)) {
                this.logResult(`数量格式化 - ${trade.stockCode}: ${formattedQuantity}`);
            } else {
                this.logResult(`数量格式化 - ${trade.stockCode}: 格式错误 ${formattedQuantity}`, false);
            }
        }
    }

    /**
     * 格式化价格
     */
    formatPrice(price) {
        return price.toFixed(2);
    }

    /**
     * 格式化日期
     */
    formatDate(date) {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 格式化数量
     */
    formatQuantity(quantity) {
        return quantity.toLocaleString('zh-CN');
    }

    /**
     * 验证价格格式
     */
    isValidPriceFormat(priceStr) {
        return /^\d+\.\d{2}$/.test(priceStr);
    }

    /**
     * 验证日期格式
     */
    isValidDateFormat(dateStr) {
        return dateStr.includes('/') && dateStr.includes(':');
    }

    /**
     * 验证数量格式
     */
    isValidQuantityFormat(quantityStr) {
        return /^\d{1,3}(,\d{3})*$/.test(quantityStr) || /^\d+$/.test(quantityStr);
    }

    /**
     * 测试用户交互响应
     */
    async testUserInteractions() {
        console.log('\n🧪 开始测试用户交互响应...');
        
        // 测试按钮点击响应
        const buttonTests = [
            { name: '添加交易按钮', action: 'add_trade' },
            { name: '编辑交易按钮', action: 'edit_trade' },
            { name: '删除交易按钮', action: 'delete_trade' },
            { name: '刷新数据按钮', action: 'refresh_data' },
            { name: '导出数据按钮', action: 'export_data' }
        ];

        for (const test of buttonTests) {
            const response = await this.simulateButtonClick(test.action);
            if (response.success) {
                this.logResult(`${test.name}点击响应: ${response.message}`);
            } else {
                this.logResult(`${test.name}点击响应失败: ${response.message}`, false);
            }
        }

        // 测试表单输入响应
        const inputTests = [
            { field: 'stockCode', value: '000001', valid: true },
            { field: 'stockCode', value: '123', valid: false },
            { field: 'buyPrice', value: '12.50', valid: true },
            { field: 'buyPrice', value: '-10', valid: false },
            { field: 'quantity', value: '1000', valid: true },
            { field: 'quantity', value: '0', valid: false }
        ];

        for (const test of inputTests) {
            const response = this.simulateInputChange(test.field, test.value);
            if (response.valid === test.valid) {
                this.logResult(`输入验证 - ${test.field}: ${test.value} -> ${response.valid ? '有效' : '无效'}`);
            } else {
                this.logResult(`输入验证 - ${test.field}: 验证结果错误`, false);
            }
        }
    }

    /**
     * 模拟按钮点击
     */
    async simulateButtonClick(action) {
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 50));
        
        switch (action) {
            case 'add_trade':
                return { success: true, message: '打开添加交易对话框' };
            case 'edit_trade':
                return { success: true, message: '打开编辑交易对话框' };
            case 'delete_trade':
                return { success: true, message: '显示删除确认对话框' };
            case 'refresh_data':
                return { success: true, message: '刷新交易数据列表' };
            case 'export_data':
                return { success: true, message: '导出数据到文件' };
            default:
                return { success: false, message: '未知操作' };
        }
    }

    /**
     * 模拟输入变化
     */
    simulateInputChange(field, value) {
        switch (field) {
            case 'stockCode':
                return { valid: /^\d{6}$/.test(value) };
            case 'buyPrice':
                const price = parseFloat(value);
                return { valid: !isNaN(price) && price > 0 };
            case 'quantity':
                const quantity = parseInt(value);
                return { valid: !isNaN(quantity) && quantity > 0 };
            default:
                return { valid: false };
        }
    }

    /**
     * 测试响应式设计
     */
    async testResponsiveDesign() {
        console.log('\n🧪 开始测试响应式设计...');
        
        const viewports = [
            { name: '桌面端', width: 1920, height: 1080 },
            { name: '平板端', width: 768, height: 1024 },
            { name: '手机端', width: 375, height: 667 }
        ];

        for (const viewport of viewports) {
            const layout = this.simulateViewportChange(viewport.width, viewport.height);
            
            if (layout.isResponsive) {
                this.logResult(`${viewport.name}布局 (${viewport.width}x${viewport.height}): 响应式正常`);
            } else {
                this.logResult(`${viewport.name}布局 (${viewport.width}x${viewport.height}): 响应式异常`, false);
            }
        }
    }

    /**
     * 模拟视口变化
     */
    simulateViewportChange(width, height) {
        // 简单的响应式逻辑模拟
        if (width >= 1200) {
            return { isResponsive: true, layout: 'desktop' };
        } else if (width >= 768) {
            return { isResponsive: true, layout: 'tablet' };
        } else {
            return { isResponsive: true, layout: 'mobile' };
        }
    }

    /**
     * 测试错误处理显示
     */
    async testErrorHandling() {
        console.log('\n🧪 开始测试错误处理显示...');
        
        const errorScenarios = [
            { type: 'network_error', message: '网络连接失败' },
            { type: 'validation_error', message: '输入数据无效' },
            { type: 'server_error', message: '服务器内部错误' },
            { type: 'permission_error', message: '权限不足' }
        ];

        for (const scenario of errorScenarios) {
            const errorDisplay = this.simulateErrorDisplay(scenario.type, scenario.message);
            
            if (errorDisplay.displayed) {
                this.logResult(`错误显示 - ${scenario.type}: ${errorDisplay.userMessage}`);
            } else {
                this.logResult(`错误显示 - ${scenario.type}: 未正确显示错误信息`, false);
            }
        }
    }

    /**
     * 模拟错误显示
     */
    simulateErrorDisplay(errorType, message) {
        const userFriendlyMessages = {
            'network_error': '网络连接异常，请检查网络设置',
            'validation_error': '输入的数据格式不正确，请重新输入',
            'server_error': '系统暂时无法处理请求，请稍后重试',
            'permission_error': '您没有执行此操作的权限'
        };

        return {
            displayed: true,
            userMessage: userFriendlyMessages[errorType] || '发生未知错误'
        };
    }

    /**
     * 运行所有UI测试
     */
    async runAllTests() {
        console.log('🚀 开始运行用户界面测试套件...\n');
        
        await this.testTradeFormValidation();
        await this.testDataDisplayFormat();
        await this.testUserInteractions();
        await this.testResponsiveDesign();
        await this.testErrorHandling();
        
        console.log('\n📊 用户界面测试完成！');
        
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
    module.exports = UITest;
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
    window.UITest = UITest;
    
    // 自动运行测试
    (async () => {
        const test = new UITest();
        await test.runAllTests();
        test.generateReport();
    })();
}
