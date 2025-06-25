import React, { useState, useEffect } from 'react';
import { Trade, StockSearchResult } from '../types';
import { StockSearch } from './StockSearch';
import { StockPriceDisplay } from './StockPriceDisplay';

interface TradeFormProps {
  onSubmit: (trade: Omit<Trade, 'id' | 'createdAt'>) => void;
  initialData?: Trade;
  onCancel?: () => void;
}

export const TradeForm: React.FC<TradeFormProps> = ({
  onSubmit,
  initialData,
  onCancel
}) => {
  // 获取当前时间的默认值
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    stockCode: initialData?.stockCode || '',
    stockName: initialData?.stockName || '',
    buyPrice: initialData?.buyPrice || 0,
    buyTime: initialData?.buyTime ? new Date(initialData.buyTime).toISOString().slice(0, 16) : getCurrentDateTime(),
    quantity: initialData?.quantity || 100, // 默认100股
    notes: initialData?.notes || '',
  });

  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceAutoFilled, setPriceAutoFilled] = useState(false);
  const [showStockPrice, setShowStockPrice] = useState(false);

  // 当选择股票时显示股价信息
  useEffect(() => {
    if (formData.stockCode && formData.stockName) {
      setShowStockPrice(true);
    } else {
      setShowStockPrice(false);
      setCurrentPrice(null);
    }
  }, [formData.stockCode, formData.stockName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      buyTime: new Date(formData.buyTime),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // 如果修改了买入价格，标记为手动修改
    if (name === 'buyPrice') {
      setPriceAutoFilled(false);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  // 处理股票选择
  const handleStockSelect = (stock: StockSearchResult) => {
    console.log('选择股票:', stock);
    try {
      setFormData(prev => ({
        ...prev,
        stockCode: stock.code,
        stockName: stock.name,
      }));
      console.log('股票选择成功');
    } catch (error) {
      console.error('股票选择失败:', error);
    }
  };

  // 处理股价更新
  const handlePriceUpdate = (price: number) => {
    console.log('股价更新:', price, typeof price);
    try {
      // 验证价格是有效数字
      if (typeof price !== 'number' || isNaN(price) || price < 0) {
        console.error('无效的价格值:', price);
        return;
      }

      setCurrentPrice(price);

      // 如果买入价格为0或者是自动填充的，则自动更新
      if (formData.buyPrice === 0 || priceAutoFilled) {
        setFormData(prev => ({
          ...prev,
          buyPrice: price,
        }));
        setPriceAutoFilled(true);
      }
      console.log('股价更新成功');
    } catch (error) {
      console.error('股价更新失败:', error);
    }
  };

  // 手动使用当前价格
  const handleUseCurrentPrice = () => {
    if (currentPrice !== null && currentPrice !== undefined && typeof currentPrice === 'number') {
      setFormData(prev => ({
        ...prev,
        buyPrice: currentPrice,
      }));
      setPriceAutoFilled(true);
    }
  };

  // 计算价格差异
  const getPriceDifference = () => {
    if (currentPrice === null || currentPrice === undefined || formData.buyPrice === 0) return null;

    const diff = formData.buyPrice - currentPrice;
    const diffPercent = (diff / currentPrice) * 100;

    return {
      amount: diff,
      percent: diffPercent,
      isHigher: diff > 0,
    };
  };

  const priceDiff = getPriceDifference();

  return (
    <div className="trade-form">
      <h2>{initialData ? '编辑交易记录' : '添加交易记录'}</h2>
      <form onSubmit={handleSubmit}>
        {/* 股票搜索选择 */}
        <div className="form-group">
          <label htmlFor="stockSearch">股票搜索</label>
          <StockSearch
            value={formData.stockCode}
            stockName={formData.stockName}
            onSelect={handleStockSelect}
            placeholder="输入股票代码或名称搜索"
            disabled={!!initialData} // 编辑模式下禁用股票选择
          />
          <small className="form-hint">
            输入股票代码（如：000001）或股票名称（如：平安银行）进行搜索
          </small>
        </div>

        {/* 股价信息显示 */}
        {showStockPrice && (
          <div className="form-group">
            <label>实时股价信息</label>
            <StockPriceDisplay
              stockCode={formData.stockCode}
              stockName={formData.stockName}
              onPriceUpdate={handlePriceUpdate}
              autoRefresh={true}
              refreshInterval={30}
            />
          </div>
        )}

        {/* 买入价格 */}
        <div className="form-group">
          <label htmlFor="buyPrice">买入价格</label>
          <div className="price-input-container">
            <input
              type="number"
              id="buyPrice"
              name="buyPrice"
              value={formData.buyPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              className={priceAutoFilled ? 'auto-filled' : ''}
            />
            {currentPrice !== null && currentPrice !== undefined && (
              <button
                type="button"
                onClick={handleUseCurrentPrice}
                className="btn-use-current-price"
                title="使用当前股价"
              >
                使用当前价 ¥{currentPrice.toFixed(2)}
              </button>
            )}
          </div>

          {/* 价格差异提示 */}
          {priceDiff && priceDiff.amount !== undefined && priceDiff.percent !== undefined && (
            <div className={`price-difference ${priceDiff.isHigher ? 'higher' : 'lower'}`}>
              {priceDiff.isHigher ? '高于' : '低于'}当前价格
              ¥{Math.abs(priceDiff.amount).toFixed(2)}
              ({priceDiff.isHigher ? '+' : ''}{priceDiff.percent.toFixed(2)}%)
            </div>
          )}

          {priceAutoFilled && (
            <small className="form-hint auto-filled-hint">
              💡 已自动填入当前股价，您可以手动修改
            </small>
          )}
        </div>

        {/* 买入时间 */}
        <div className="form-group">
          <label htmlFor="buyTime">买入时间</label>
          <input
            type="datetime-local"
            id="buyTime"
            name="buyTime"
            value={formData.buyTime}
            onChange={handleChange}
            required
          />
          <small className="form-hint">
            默认为当前时间，您可以修改为实际买入时间
          </small>
        </div>

        {/* 买入数量 */}
        <div className="form-group">
          <label htmlFor="quantity">买入数量（股）</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            step="100"
            placeholder="100"
            required
          />
          <small className="form-hint">
            A股通常以100股为一手进行交易
          </small>
        </div>

        {/* 备注 */}
        <div className="form-group">
          <label htmlFor="notes">备注</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="可选备注信息，如：买入原因、投资策略等"
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {initialData ? '更新交易记录' : '添加交易记录'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              取消
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
