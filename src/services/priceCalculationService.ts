import { Trade, PriceCalculation, Settings } from '../types';
import { PriceCalculator } from '../utils/priceCalculator';

/**
 * 价格计算服务
 * 提供股票交易的价格计算和分析功能
 */
export class PriceCalculationService {
  private settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Settings) {
    this.settings = settings;
  }

  /**
   * 计算单个交易的价格目标
   */
  calculateTradeTargets(trade: Trade, currentPrice?: number): PriceCalculation {
    return PriceCalculator.calculatePriceTargets(
      trade,
      this.settings.buyStepPercentage,
      this.settings.annualReturnRate,
      currentPrice
    );
  }

  /**
   * 批量计算多个交易的价格目标
   */
  calculateMultipleTradeTargets(
    trades: Trade[],
    currentPrices: Record<string, number> = {}
  ): Record<number, PriceCalculation> {
    const results: Record<number, PriceCalculation> = {};
    
    trades.forEach(trade => {
      if (trade.id) {
        const currentPrice = currentPrices[trade.stockCode];
        results[trade.id] = this.calculateTradeTargets(trade, currentPrice);
      }
    });
    
    return results;
  }

  /**
   * 分析投资组合
   */
  analyzePortfolio(trades: Trade[], currentPrices: Record<string, number> = {}) {
    const calculations = this.calculateMultipleTradeTargets(trades, currentPrices);
    
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalUnrealizedGain = 0;
    let sellSignals = 0;
    let buySignals = 0;
    
    const stockSummary: Record<string, {
      code: string;
      name: string;
      totalQuantity: number;
      averagePrice: number;
      currentPrice?: number;
      totalValue: number;
      unrealizedGain: number;
      unrealizedGainPercent: number;
      signals: Array<{ type: 'sell' | 'buy'; tradeId: number; targetPrice: number }>;
    }> = {};

    trades.forEach(trade => {
      if (!trade.id) return;
      
      const calculation = calculations[trade.id];
      const currentPrice = currentPrices[trade.stockCode];
      const investment = trade.buyPrice * trade.quantity;
      const currentValue = currentPrice ? currentPrice * trade.quantity : investment;
      
      totalInvestment += investment;
      totalCurrentValue += currentValue;
      totalUnrealizedGain += (currentValue - investment);
      
      // 统计信号
      if (calculation.priceReached === 'sell') sellSignals++;
      if (calculation.priceReached === 'buy') buySignals++;
      
      // 股票汇总
      if (!stockSummary[trade.stockCode]) {
        stockSummary[trade.stockCode] = {
          code: trade.stockCode,
          name: trade.stockName,
          totalQuantity: 0,
          averagePrice: 0,
          currentPrice: currentPrice,
          totalValue: 0,
          unrealizedGain: 0,
          unrealizedGainPercent: 0,
          signals: [],
        };
      }
      
      const stock = stockSummary[trade.stockCode];
      const prevTotalValue = stock.averagePrice * stock.totalQuantity;
      stock.totalQuantity += trade.quantity;
      stock.averagePrice = (prevTotalValue + investment) / stock.totalQuantity;
      stock.totalValue += currentValue;
      stock.unrealizedGain += (currentValue - investment);
      stock.unrealizedGainPercent = ((stock.totalValue - (stock.averagePrice * stock.totalQuantity)) / (stock.averagePrice * stock.totalQuantity)) * 100;
      
      // 添加信号
      if (calculation.priceReached === 'sell') {
        stock.signals.push({
          type: 'sell',
          tradeId: trade.id,
          targetPrice: calculation.sellTargetPrice,
        });
      } else if (calculation.priceReached === 'buy') {
        stock.signals.push({
          type: 'buy',
          tradeId: trade.id,
          targetPrice: calculation.buyTargetPrice,
        });
      }
    });

    return {
      overview: {
        totalInvestment,
        totalCurrentValue,
        totalUnrealizedGain,
        totalUnrealizedGainPercent: totalInvestment > 0 ? (totalUnrealizedGain / totalInvestment) * 100 : 0,
        sellSignals,
        buySignals,
        totalTrades: trades.length,
        totalStocks: Object.keys(stockSummary).length,
      },
      stockSummary: Object.values(stockSummary),
      calculations,
    };
  }

  /**
   * 获取需要关注的交易（达到目标价格）
   */
  getAlertTrades(trades: Trade[], currentPrices: Record<string, number> = {}) {
    const calculations = this.calculateMultipleTradeTargets(trades, currentPrices);
    
    const alerts: Array<{
      trade: Trade;
      calculation: PriceCalculation;
      alertType: 'sell' | 'buy';
      message: string;
    }> = [];

    trades.forEach(trade => {
      if (!trade.id) return;
      
      const calculation = calculations[trade.id];
      
      if (calculation.priceReached === 'sell') {
        alerts.push({
          trade,
          calculation,
          alertType: 'sell',
          message: `${trade.stockName}(${trade.stockCode}) 已达到卖出目标价格 ¥${calculation.sellTargetPrice.toFixed(2)}`,
        });
      } else if (calculation.priceReached === 'buy') {
        alerts.push({
          trade,
          calculation,
          alertType: 'buy',
          message: `${trade.stockName}(${trade.stockCode}) 已达到买入目标价格 ¥${calculation.buyTargetPrice.toFixed(2)}`,
        });
      }
    });

    return alerts;
  }

  /**
   * 计算最优卖出时机
   */
  calculateOptimalSellTime(trade: Trade): {
    minDays: number;
    optimalDays: number;
    maxRecommendedDays: number;
    reasons: string[];
  } {
    const daysHeld = PriceCalculator.calculateDaysHeld(trade.buyTime);
    const reasons: string[] = [];
    
    // 最少持有30天（算法要求）
    const minDays = 30;
    
    // 计算达到目标收益率的天数
    const targetDays = Math.ceil((this.settings.annualReturnRate * 360) / this.settings.annualReturnRate);
    
    // 最优卖出时机：1年内
    const optimalDays = Math.min(365, targetDays);
    
    // 最大推荐持有时间：2年
    const maxRecommendedDays = 730;
    
    if (daysHeld < minDays) {
      reasons.push(`建议至少持有${minDays}天以获得更好的收益`);
    }
    
    if (daysHeld >= optimalDays) {
      reasons.push('已达到最优持有期，可考虑卖出');
    }
    
    if (daysHeld > maxRecommendedDays) {
      reasons.push('持有时间较长，建议重新评估投资价值');
    }

    return {
      minDays,
      optimalDays,
      maxRecommendedDays,
      reasons,
    };
  }

  /**
   * 生成投资建议
   */
  generateInvestmentAdvice(trade: Trade, calculation: PriceCalculation): {
    action: 'hold' | 'sell' | 'buy_more' | 'review';
    confidence: 'high' | 'medium' | 'low';
    reasons: string[];
    suggestions: string[];
  } {
    const daysHeld = calculation.daysSincePurchase;
    const currentPrice = calculation.currentPrice;
    const reasons: string[] = [];
    const suggestions: string[] = [];
    
    let action: 'hold' | 'sell' | 'buy_more' | 'review' = 'hold';
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    // 基于价格信号的建议
    if (calculation.priceReached === 'sell') {
      action = 'sell';
      confidence = 'high';
      reasons.push('当前价格已达到卖出目标');
      suggestions.push('考虑分批卖出以降低风险');
    } else if (calculation.priceReached === 'buy') {
      action = 'buy_more';
      confidence = 'medium';
      reasons.push('当前价格已达到买入目标');
      suggestions.push('可考虑加仓，但需控制仓位');
    }

    // 基于持有时间的建议
    if (daysHeld < 30) {
      reasons.push('持有时间较短，建议继续观察');
      if (action === 'sell') {
        confidence = 'medium';
        suggestions.push('虽然达到目标价格，但持有时间较短，可考虑继续持有');
      }
    } else if (daysHeld > 365) {
      reasons.push('持有时间较长，建议重新评估');
      action = 'review';
      suggestions.push('分析公司基本面是否发生变化');
    }

    // 基于收益率的建议
    if (currentPrice && trade.buyPrice) {
      const returnRate = PriceCalculator.calculateReturnRate(trade.buyPrice, currentPrice);
      const annualizedReturn = PriceCalculator.calculateAnnualizedReturn(trade.buyPrice, currentPrice, daysHeld);
      
      if (returnRate > 0.5) { // 收益超过50%
        reasons.push('收益率较高，可考虑部分获利了结');
        suggestions.push('建议分批卖出，保留部分仓位');
      } else if (returnRate < -0.2) { // 亏损超过20%
        reasons.push('当前亏损较大，需谨慎决策');
        suggestions.push('分析亏损原因，考虑是否止损或加仓摊薄成本');
        action = 'review';
      }
      
      if (annualizedReturn > this.settings.annualReturnRate * 1.5) {
        reasons.push('年化收益率超过预期目标');
        confidence = 'high';
      }
    }

    return {
      action,
      confidence,
      reasons,
      suggestions,
    };
  }
}
