import React, { useState } from 'react';
import { StockSearchResult } from '../types';
import { StockSearch } from './StockSearch';
import { StockPriceDisplay } from './StockPriceDisplay';

export const StockSelectTest: React.FC = () => {
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const handleStockSelect = (stock: StockSearchResult) => {
    addLog(`选择股票: ${stock.code} - ${stock.name}`);
    setSelectedStock(stock);
  };

  const handlePriceUpdate = (price: number) => {
    addLog(`股价更新: ${price} (类型: ${typeof price})`);
    if (typeof price === 'number' && !isNaN(price)) {
      addLog(`格式化价格: ¥${price.toFixed(2)}`);
    } else {
      addLog(`警告: 无效的价格值`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>股票选择功能测试</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>1. 股票搜索</h3>
        <StockSearch
          value={selectedStock?.code || ''}
          stockName={selectedStock?.name || ''}
          onSelect={handleStockSelect}
          placeholder="输入股票代码或名称搜索"
        />
      </div>

      {selectedStock && (
        <div style={{ marginBottom: '20px' }}>
          <h3>2. 选中的股票</h3>
          <div style={{ 
            padding: '10px', 
            border: '1px solid #ccc', 
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            <p><strong>代码:</strong> {selectedStock.code}</p>
            <p><strong>名称:</strong> {selectedStock.name}</p>
            <p><strong>市场:</strong> {selectedStock.market}</p>
            {selectedStock.stock_type && (
              <p><strong>类型:</strong> {selectedStock.stock_type}</p>
            )}
          </div>
        </div>
      )}

      {selectedStock && (
        <div style={{ marginBottom: '20px' }}>
          <h3>3. 股价信息</h3>
          <StockPriceDisplay
            stockCode={selectedStock.code}
            stockName={selectedStock.name}
            onPriceUpdate={handlePriceUpdate}
            autoRefresh={true}
            refreshInterval={10}
          />
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>4. 操作日志</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={clearLogs} style={{ padding: '5px 10px' }}>
            清空日志
          </button>
          <button 
            onClick={() => addLog('手动测试日志')} 
            style={{ padding: '5px 10px' }}
          >
            添加测试日志
          </button>
        </div>
        <div style={{ 
          height: '200px', 
          overflow: 'auto', 
          border: '1px solid #ccc', 
          padding: '10px',
          backgroundColor: '#f5f5f5',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <p style={{ color: '#666' }}>暂无日志</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h4>测试说明:</h4>
        <ol>
          <li>在搜索框中输入股票代码或名称（如：000001 或 平安银行）</li>
          <li>从下拉列表中选择一个股票</li>
          <li>观察是否正确显示股票信息和股价</li>
          <li>检查操作日志是否记录了所有步骤</li>
          <li>如果出现错误，请查看浏览器控制台</li>
        </ol>
      </div>
    </div>
  );
};
