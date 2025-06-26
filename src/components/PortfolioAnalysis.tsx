import React, { useState, useEffect } from 'react';
import { Trade, Settings } from '../types';
import { PriceCalculationService } from '../services/priceCalculationService';
import { useTauri } from '../hooks/useTauri';

interface PortfolioAnalysisProps {
  trades: Trade[];
  settings: Settings;
  onRefresh?: () => void;
}

export const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({
  trades,
  settings,
  onRefresh,
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const tauri = useTauri();
  const calculationService = new PriceCalculationService(settings);

  // 获取所有股票的当前价格
  const fetchCurrentPrices = async () => {
    setIsLoading(true);
    const prices: Record<string, number> = {};
    
    try {
      // 获取所有唯一的股票代码
      const uniqueStockCodes = [...new Set(trades.map(trade => trade.stockCode))];
      
      // 并发获取所有股价
      const pricePromises = uniqueStockCodes.map(async (code) => {
        try {
          const stockInfo = await tauri.getStockInfo(code);
          return { code, price: stockInfo.currentPrice };
        } catch (error) {
          console.error(`获取股价失败: ${code}`, error);
          return { code, price: 0 };
        }
      });
      
      const results = await Promise.all(pricePromises);
      results.forEach(({ code, price }) => {
        prices[code] = price;
      });
      

      
      // 计算分析结果
      const portfolioAnalysis = calculationService.analyzePortfolio(trades, prices);
      setAnalysis(portfolioAnalysis);
      
    } catch (error) {
      console.error('获取股价失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trades.length > 0) {
      fetchCurrentPrices();
    }
  }, [trades, settings]);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    if (typeof percent !== 'number' || isNaN(percent)) {
      return '--%';
    }
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const getPercentColorClass = (percent: number) => {
    if (percent > 0) return 'text-green-600';
    if (percent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (trades.length === 0) {
    return (
      <div className="portfolio-analysis empty">
        <div className="empty-state">
          <h3>投资组合分析</h3>
          <p>暂无交易记录，请先添加交易记录</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="portfolio-analysis loading">
        <div className="loading-content">
          <span className="loading-spinner">⟳</span>
          <span>正在分析投资组合...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="portfolio-analysis error">
        <div className="error-content">
          <span>分析失败</span>
          <button onClick={fetchCurrentPrices} className="btn-small">
            重试
          </button>
        </div>
      </div>
    );
  }

  const { overview, stockSummary } = analysis;

  return (
    <div className="portfolio-analysis">
      <div className="analysis-header">
        <h2>投资组合分析</h2>
        <div className="header-actions">
          <button 
            onClick={fetchCurrentPrices}
            className="btn-refresh"
            disabled={isLoading}
          >
            {isLoading ? '⟳' : '🔄'} 刷新
          </button>
          {onRefresh && (
            <button onClick={onRefresh} className="btn-secondary">
              更新数据
            </button>
          )}
        </div>
      </div>

      {/* 总览 */}
      <div className="overview-section">
        <h3>投资总览</h3>
        <div className="overview-grid">
          <div className="overview-item">
            <span className="label">总投资金额</span>
            <span className="value">{formatCurrency(overview.totalInvestment)}</span>
          </div>
          <div className="overview-item">
            <span className="label">当前市值</span>
            <span className="value">{formatCurrency(overview.totalCurrentValue)}</span>
          </div>
          <div className="overview-item">
            <span className="label">浮动盈亏</span>
            <span className={`value ${getPercentColorClass(overview.totalUnrealizedGain)}`}>
              {formatCurrency(overview.totalUnrealizedGain)}
            </span>
          </div>
          <div className="overview-item">
            <span className="label">收益率</span>
            <span className={`value ${getPercentColorClass(overview.totalUnrealizedGainPercent)}`}>
              {formatPercent(overview.totalUnrealizedGainPercent)}
            </span>
          </div>
        </div>
        
        <div className="signals-summary">
          <div className="signal-item sell">
            <span className="signal-count">{overview.sellSignals}</span>
            <span className="signal-label">卖出信号</span>
          </div>
          <div className="signal-item buy">
            <span className="signal-count">{overview.buySignals}</span>
            <span className="signal-label">买入信号</span>
          </div>
          <div className="signal-item total">
            <span className="signal-count">{overview.totalTrades}</span>
            <span className="signal-label">总交易数</span>
          </div>
          <div className="signal-item stocks">
            <span className="signal-count">{overview.totalStocks}</span>
            <span className="signal-label">持仓股票</span>
          </div>
        </div>
      </div>

      {/* 股票明细 */}
      <div className="stocks-section">
        <h3>持仓明细</h3>
        <div className="stocks-table">
          <table>
            <thead>
              <tr>
                <th>股票</th>
                <th>持仓数量</th>
                <th>平均成本</th>
                <th>当前价格</th>
                <th>市值</th>
                <th>盈亏</th>
                <th>收益率</th>
                <th>信号</th>
              </tr>
            </thead>
            <tbody>
              {stockSummary.map((stock: any) => (
                <tr key={stock.code}>
                  <td>
                    <div className="stock-info">
                      <span className="stock-code">{stock.code}</span>
                      <span className="stock-name">{stock.name}</span>
                    </div>
                  </td>
                  <td>{stock.totalQuantity.toLocaleString()}</td>
                  <td>{formatCurrency(stock.averagePrice)}</td>
                  <td>
                    {stock.currentPrice ? formatCurrency(stock.currentPrice) : '-'}
                  </td>
                  <td>{formatCurrency(stock.totalValue)}</td>
                  <td className={getPercentColorClass(stock.unrealizedGain)}>
                    {formatCurrency(stock.unrealizedGain)}
                  </td>
                  <td className={getPercentColorClass(stock.unrealizedGainPercent)}>
                    {formatPercent(stock.unrealizedGainPercent)}
                  </td>
                  <td>
                    <div className="signals">
                      {stock.signals.map((signal: any, index: number) => (
                        <span 
                          key={index}
                          className={`signal-badge ${signal.type}`}
                          title={`目标价格: ${formatCurrency(signal.targetPrice)}`}
                        >
                          {signal.type === 'sell' ? '卖' : '买'}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
