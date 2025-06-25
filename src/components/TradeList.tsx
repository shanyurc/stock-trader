import React from 'react';
import { Trade, PriceCalculation } from '../types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TradeListProps {
  trades: Trade[];
  priceCalculations: Record<number, PriceCalculation>;
  onEdit: (trade: Trade) => void;
  onDelete: (id: number) => void;
  onCalculatePrice: (tradeId: number) => void;
}

export const TradeList: React.FC<TradeListProps> = ({
  trades,
  priceCalculations,
  onEdit,
  onDelete,
  onCalculatePrice,
}) => {
  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '¥--';
    }
    return `¥${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  };

  const getPriceReachedColor = (status: string) => {
    switch (status) {
      case 'sell':
        return 'text-green-600';
      case 'buy':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriceReachedText = (status: string) => {
    switch (status) {
      case 'sell':
        return '达到卖出价';
      case 'buy':
        return '达到买入价';
      default:
        return '未达到目标';
    }
  };

  if (trades.length === 0) {
    return (
      <div className="trade-list-empty">
        <p>暂无交易记录</p>
        <p>点击"添加交易记录"开始记录您的投资</p>
      </div>
    );
  }

  return (
    <div className="trade-list">
      <h2>交易记录</h2>
      <div className="trade-table">
        <table>
          <thead>
            <tr>
              <th>股票代码</th>
              <th>股票名称</th>
              <th>买入价格</th>
              <th>买入时间</th>
              <th>数量</th>
              <th>当前价格</th>
              <th>卖出目标</th>
              <th>买入目标</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const calculation = trade.id ? priceCalculations[trade.id] : null;
              return (
                <tr key={trade.id}>
                  <td>{trade.stockCode}</td>
                  <td>{trade.stockName}</td>
                  <td>{formatCurrency(trade.buyPrice)}</td>
                  <td>{formatDate(trade.buyTime)}</td>
                  <td>{trade.quantity}</td>
                  <td>
                    {calculation?.currentPrice 
                      ? formatCurrency(calculation.currentPrice)
                      : '-'
                    }
                  </td>
                  <td>
                    {calculation 
                      ? formatCurrency(calculation.sellTargetPrice)
                      : '-'
                    }
                  </td>
                  <td>
                    {calculation 
                      ? formatCurrency(calculation.buyTargetPrice)
                      : '-'
                    }
                  </td>
                  <td>
                    {calculation ? (
                      <span className={getPriceReachedColor(calculation.priceReached)}>
                        {getPriceReachedText(calculation.priceReached)}
                      </span>
                    ) : (
                      <button 
                        onClick={() => trade.id && onCalculatePrice(trade.id)}
                        className="btn-small"
                      >
                        计算
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => onEdit(trade)}
                        className="btn-edit"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => trade.id && onDelete(trade.id)}
                        className="btn-delete"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
