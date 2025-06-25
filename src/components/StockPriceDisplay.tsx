import React, { useState, useEffect, useRef } from 'react';
import { StockInfo } from '../types';
import { useTauri } from '../hooks/useTauri';

interface StockPriceDisplayProps {
  stockCode: string;
  stockName: string;
  onPriceUpdate?: (price: number) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // 秒
}

export const StockPriceDisplay: React.FC<StockPriceDisplayProps> = ({
  stockCode,
  stockName,
  onPriceUpdate,
  autoRefresh = true,
  refreshInterval = 30,
}) => {
  const [stockInfo, setStockInfo] = useState<StockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const tauri = useTauri();
  const intervalRef = useRef<NodeJS.Timeout>();

  // 获取股票信息
  const fetchStockInfo = async () => {
    if (!stockCode) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const info = await tauri.getStockInfo(stockCode);
      setStockInfo(info);
      setLastUpdateTime(new Date());
      
      // 通知父组件价格更新
      if (onPriceUpdate && typeof info.currentPrice === 'number' && !isNaN(info.currentPrice)) {
        onPriceUpdate(info.currentPrice);
      }
    } catch (err) {
      setError('获取股价失败');
      console.error('获取股价失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和股票代码变化时重新获取
  useEffect(() => {
    if (stockCode) {
      fetchStockInfo();
    } else {
      setStockInfo(null);
      setLastUpdateTime(null);
      setError(null);
    }
  }, [stockCode]);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh && stockCode && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchStockInfo();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, stockCode, refreshInterval]);

  // 手动刷新
  const handleManualRefresh = () => {
    fetchStockInfo();
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '¥--';
    }
    return `¥${price.toFixed(2)}`;
  };

  // 格式化变化
  const formatChange = (change: number, changePercent: number) => {
    if (typeof change !== 'number' || isNaN(change) || typeof changePercent !== 'number' || isNaN(changePercent)) {
      return '--';
    }
    const changeStr = change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
    const percentStr = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
    return `${changeStr} (${percentStr})`;
  };

  // 获取变化颜色类名
  const getChangeColorClass = (change: number) => {
    if (change > 0) return 'price-up';
    if (change < 0) return 'price-down';
    return 'price-neutral';
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!stockCode) {
    return (
      <div className="stock-price-display empty">
        <p>请先选择股票</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-price-display error">
        <div className="error-message">
          <span>❌ {error}</span>
          <button 
            onClick={handleManualRefresh}
            className="btn-small"
            disabled={isLoading}
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!stockInfo && isLoading) {
    return (
      <div className="stock-price-display loading">
        <div className="loading-content">
          <span className="loading-spinner">⟳</span>
          <span>获取股价中...</span>
        </div>
      </div>
    );
  }

  if (!stockInfo || typeof stockInfo.currentPrice !== 'number') {
    return (
      <div className="stock-price-display empty">
        <p>暂无股价数据</p>
        <button
          onClick={handleManualRefresh}
          className="btn-small"
        >
          获取股价
        </button>
      </div>
    );
  }

  return (
    <div className="stock-price-display">
      <div className="stock-header">
        <div className="stock-title">
          <span className="stock-code">{stockInfo.code}</span>
          <span className="stock-name">{stockInfo.name}</span>
        </div>
        <div className="refresh-controls">
          {lastUpdateTime && (
            <span className="last-update">
              {formatTime(lastUpdateTime)}
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            className="btn-refresh"
            disabled={isLoading}
            title="手动刷新"
          >
            {isLoading ? '⟳' : '🔄'}
          </button>
        </div>
      </div>

      <div className="price-info">
        <div className="current-price">
          <span className="price-label">当前价格</span>
          <span className="price-value">
            {formatPrice(stockInfo.currentPrice)}
          </span>
        </div>
        
        <div className={`price-change ${getChangeColorClass(stockInfo.change)}`}>
          {formatChange(stockInfo.change, stockInfo.changePercent)}
        </div>
      </div>

      <div className="price-details">
        <div className="price-item">
          <span className="label">开盘</span>
          <span className="value">{formatPrice(stockInfo.open)}</span>
        </div>
        <div className="price-item">
          <span className="label">最高</span>
          <span className="value">{formatPrice(stockInfo.high)}</span>
        </div>
        <div className="price-item">
          <span className="label">最低</span>
          <span className="value">{formatPrice(stockInfo.low)}</span>
        </div>
      </div>

      {autoRefresh && (
        <div className="auto-refresh-info">
          <span>🔄 每 {refreshInterval} 秒自动刷新</span>
        </div>
      )}
    </div>
  );
};
