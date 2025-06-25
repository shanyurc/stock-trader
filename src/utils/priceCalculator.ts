import { Trade, PriceCalculation } from '../types';

/**
 * 价格计算工具类
 * 实现股票交易的动态价格计算算法
 */
export class PriceCalculator {
  /**
   * 计算卖出目标价格
   * 公式: 买入价格 × (1 + 年化收益率 ÷ 360) × MAX(持有天数, 30)
   * 
   * @param buyPrice 买入价格
   * @param annualReturnRate 年化收益率 (例如: 0.20 表示 20%)
   * @param daysHeld 持有天数
   * @returns 卖出目标价格
   */
  static calculateSellTargetPrice(
    buyPrice: number,
    annualReturnRate: number,
    daysHeld: number
  ): number {
    const effectiveDays = Math.max(daysHeld, 30);
    const dailyRate = annualReturnRate / 360;
    return buyPrice * (1 + dailyRate * effectiveDays);
  }

  /**
   * 计算买入目标价格
   * 公式: 卖出目标价格 × (1 - 买入台阶百分比)
   * 
   * @param sellTargetPrice 卖出目标价格
   * @param buyStepPercentage 买入台阶百分比 (例如: 0.05 表示 5%)
   * @returns 买入目标价格
   */
  static calculateBuyTargetPrice(
    sellTargetPrice: number,
    buyStepPercentage: number
  ): number {
    return sellTargetPrice * (1 - buyStepPercentage);
  }

  /**
   * 计算持有天数
   * 
   * @param buyTime 买入时间
   * @param currentTime 当前时间 (可选，默认为当前时间)
   * @returns 持有天数
   */
  static calculateDaysHeld(buyTime: Date, currentTime: Date = new Date()): number {
    const timeDiff = currentTime.getTime() - new Date(buyTime).getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * 判断当前价格是否达到目标
   * 
   * @param currentPrice 当前价格
   * @param sellTargetPrice 卖出目标价格
   * @param buyTargetPrice 买入目标价格
   * @returns 价格状态: 'sell' | 'buy' | 'none'
   */
  static checkPriceTarget(
    currentPrice: number,
    sellTargetPrice: number,
    buyTargetPrice: number
  ): 'sell' | 'buy' | 'none' {
    if (currentPrice >= sellTargetPrice) {
      return 'sell';
    } else if (currentPrice <= buyTargetPrice) {
      return 'buy';
    } else {
      return 'none';
    }
  }

  /**
   * 计算完整的价格目标信息
   * 
   * @param trade 交易记录
   * @param buyStepPercentage 买入台阶百分比
   * @param annualReturnRate 年化收益率
   * @param currentPrice 当前价格 (可选)
   * @returns 价格计算结果
   */
  static calculatePriceTargets(
    trade: Trade,
    buyStepPercentage: number,
    annualReturnRate: number,
    currentPrice?: number
  ): PriceCalculation {
    const daysHeld = this.calculateDaysHeld(trade.buyTime);
    
    const sellTargetPrice = this.calculateSellTargetPrice(
      trade.buyPrice,
      annualReturnRate,
      daysHeld
    );
    
    const buyTargetPrice = this.calculateBuyTargetPrice(
      sellTargetPrice,
      buyStepPercentage
    );
    
    const priceReached = currentPrice 
      ? this.checkPriceTarget(currentPrice, sellTargetPrice, buyTargetPrice)
      : 'none';
    
    return {
      sellTargetPrice,
      buyTargetPrice,
      daysSincePurchase: daysHeld,
      currentPrice,
      priceReached,
    };
  }

  /**
   * 计算收益率
   * 
   * @param buyPrice 买入价格
   * @param currentPrice 当前价格
   * @returns 收益率 (例如: 0.15 表示 15%)
   */
  static calculateReturnRate(buyPrice: number, currentPrice: number): number {
    return (currentPrice - buyPrice) / buyPrice;
  }

  /**
   * 计算收益金额
   * 
   * @param buyPrice 买入价格
   * @param currentPrice 当前价格
   * @param quantity 持有数量
   * @returns 收益金额
   */
  static calculateProfitAmount(
    buyPrice: number,
    currentPrice: number,
    quantity: number
  ): number {
    return (currentPrice - buyPrice) * quantity;
  }

  /**
   * 计算年化收益率
   * 
   * @param buyPrice 买入价格
   * @param currentPrice 当前价格
   * @param daysHeld 持有天数
   * @returns 年化收益率
   */
  static calculateAnnualizedReturn(
    buyPrice: number,
    currentPrice: number,
    daysHeld: number
  ): number {
    if (daysHeld <= 0) return 0;
    
    const returnRate = this.calculateReturnRate(buyPrice, currentPrice);
    return (returnRate * 365) / daysHeld;
  }

  /**
   * 格式化价格显示
   * 
   * @param price 价格
   * @param currency 货币符号 (默认为 ¥)
   * @returns 格式化后的价格字符串
   */
  static formatPrice(price: number, currency: string = '¥'): string {
    if (typeof price !== 'number' || isNaN(price)) {
      return `${currency}--`;
    }
    return `${currency}${price.toFixed(2)}`;
  }

  /**
   * 格式化百分比显示
   * 
   * @param rate 比率 (例如: 0.15 表示 15%)
   * @param decimals 小数位数 (默认为 2)
   * @returns 格式化后的百分比字符串
   */
  static formatPercentage(rate: number, decimals: number = 2): string {
    if (typeof rate !== 'number' || isNaN(rate)) {
      return '--%';
    }
    return `${(rate * 100).toFixed(decimals)}%`;
  }

  /**
   * 验证价格计算参数
   * 
   * @param buyStepPercentage 买入台阶百分比
   * @param annualReturnRate 年化收益率
   * @returns 验证结果
   */
  static validateParameters(
    buyStepPercentage: number,
    annualReturnRate: number
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (buyStepPercentage < 0 || buyStepPercentage > 1) {
      errors.push('买入台阶百分比必须在 0% 到 100% 之间');
    }
    
    if (annualReturnRate < 0 || annualReturnRate > 10) {
      errors.push('年化收益率必须在 0% 到 1000% 之间');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
