import React, { useState, useEffect } from 'react';
import { Trade, Settings } from '../types';
import { PriceCalculationService } from '../services/priceCalculationService';
import { useTauri } from '../hooks/useTauri';

interface PriceAlertsProps {
  trades: Trade[];
  settings: Settings;
  onTradeClick?: (trade: Trade) => void;
}

export const PriceAlerts: React.FC<PriceAlertsProps> = ({
  trades,
  settings,
  onTradeClick,
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  
  const tauri = useTauri();
  const calculationService = new PriceCalculationService(settings);

  // 检查价格提醒
  const checkPriceAlerts = async () => {
    if (trades.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // 获取所有股票的当前价格
      const uniqueStockCodes = [...new Set(trades.map(trade => trade.stockCode))];
      const currentPrices: Record<string, number> = {};
      
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
        currentPrices[code] = price;
      });
      
      // 获取提醒
      const alertTrades = calculationService.getAlertTrades(trades, currentPrices);
      setAlerts(alertTrades);
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error('检查价格提醒失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和定时刷新
  useEffect(() => {
    checkPriceAlerts();
    
    // 每5分钟检查一次
    const interval = setInterval(checkPriceAlerts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [trades, settings]);

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAlertClick = (alert: any) => {
    if (onTradeClick) {
      onTradeClick(alert.trade);
    }
  };

  const getAlertIcon = (alertType: 'sell' | 'buy') => {
    return alertType === 'sell' ? '📈' : '📉';
  };

  const getAlertColorClass = (alertType: 'sell' | 'buy') => {
    return alertType === 'sell' ? 'alert-sell' : 'alert-buy';
  };

  return (
    <div className="price-alerts">
      <div className="alerts-header">
        <h3>价格提醒</h3>
        <div className="header-info">
          {lastUpdateTime && (
            <span className="last-update">
              最后更新: {formatTime(lastUpdateTime)}
            </span>
          )}
          <button
            onClick={checkPriceAlerts}
            className="btn-refresh"
            disabled={isLoading}
            title="手动刷新"
          >
            {isLoading ? '⟳' : '🔄'}
          </button>
        </div>
      </div>

      {isLoading && alerts.length === 0 && (
        <div className="alerts-loading">
          <span className="loading-spinner">⟳</span>
          <span>检查价格提醒中...</span>
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="alerts-empty">
          <div className="empty-content">
            <span className="empty-icon">🔕</span>
            <h4>暂无价格提醒</h4>
            <p>当股票价格达到目标价格时，会在这里显示提醒</p>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="alerts-list">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`alert-item ${getAlertColorClass(alert.alertType)}`}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="alert-icon">
                {getAlertIcon(alert.alertType)}
              </div>
              
              <div className="alert-content">
                <div className="alert-header">
                  <span className="stock-info">
                    {alert.trade.stockName} ({alert.trade.stockCode})
                  </span>
                  <span className={`alert-type ${alert.alertType}`}>
                    {alert.alertType === 'sell' ? '卖出信号' : '买入信号'}
                  </span>
                </div>
                
                <div className="alert-message">
                  {alert.message}
                </div>
                
                <div className="alert-details">
                  <div className="detail-item">
                    <span className="label">买入价格:</span>
                    <span className="value">{formatCurrency(alert.trade.buyPrice)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">当前价格:</span>
                    <span className="value">{formatCurrency(alert.calculation.currentPrice)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">目标价格:</span>
                    <span className="value">
                      {formatCurrency(
                        alert.alertType === 'sell' 
                          ? alert.calculation.sellTargetPrice 
                          : alert.calculation.buyTargetPrice
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">持有天数:</span>
                    <span className="value">{alert.calculation.daysSincePurchase} 天</span>
                  </div>
                </div>
              </div>
              
              <div className="alert-actions">
                <button
                  className="btn-small btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAlertClick(alert);
                  }}
                >
                  查看详情
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提醒设置提示 */}
      <div className="alerts-footer">
        <div className="alert-info">
          <span className="info-icon">💡</span>
          <div className="info-content">
            <p>价格提醒每5分钟自动检查一次</p>
            <p>
              卖出目标: 年化收益率 {(settings.annualReturnRate * 100).toFixed(1)}% | 
              买入目标: 下跌 {(settings.buyStepPercentage * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
