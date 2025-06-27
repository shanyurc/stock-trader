import { invoke } from '@tauri-apps/api/tauri';
import { Trade, PriceCalculation, StockPriceResponse, StockSearchResult, StockInfo } from '../types';

// 检查是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== 'undefined' && window.__TAURI__;
};

// Tauri 命令包装器
export const useTauri = () => {
  // 交易记录相关命令
  const createTrade = async (trade: Omit<Trade, 'id' | 'createdAt'>): Promise<number> => {
    if (!isTauri()) {
      // 模拟数据
      return Promise.resolve(Date.now());
    }
    return invoke<number>('create_trade', { trade });
  };

  const getAllTrades = async (): Promise<Trade[]> => {
    if (!isTauri()) {
      // 模拟数据
      return Promise.resolve([
        {
          id: 1,
          stockCode: "000001",
          stockName: "平安银行",
          buyPrice: 12.50,
          buyTime: new Date("2024-01-15T10:30:00"),
          quantity: 1000,
          notes: "看好银行股",
          createdAt: new Date("2024-01-15T10:30:00"),
        },
        {
          id: 2,
          stockCode: "000002",
          stockName: "万科A",
          buyPrice: 8.80,
          buyTime: new Date("2024-02-01T14:20:00"),
          quantity: 500,
          notes: "地产龙头",
          createdAt: new Date("2024-02-01T14:20:00"),
        },
      ]);
    }
    return invoke<Trade[]>('get_all_trades');
  };

  const updateTrade = async (trade: Trade): Promise<void> => {
    if (!isTauri()) {
      return Promise.resolve();
    }
    return invoke('update_trade', { trade });
  };

  const deleteTrade = async (id: number): Promise<void> => {
    if (!isTauri()) {
      return Promise.resolve();
    }
    return invoke('delete_trade', { id });
  };

  // 股价相关命令
  const getStockPrice = async (stockCode: string): Promise<StockPriceResponse> => {
    if (!isTauri()) {
      // 模拟数据
      const mockStocks: Record<string, any> = {
        '000001': { name: '平安银行', price: 12.50 },
        '000002': { name: '万科A', price: 8.80 },
        '600036': { name: '招商银行', price: 35.20 },
        '000858': { name: '五粮液', price: 128.50 },
        '600519': { name: '贵州茅台', price: 1680.00 },
      };

      const stock = mockStocks[stockCode] || { name: '未知股票', price: 10.0 + Math.random() * 5 };
      const change = -0.5 + Math.random();

      return Promise.resolve({
        code: stockCode,
        name: stock.name,
        price: stock.price,
        change: change,
        changePercent: (change / stock.price) * 100,
        timestamp: new Date(),
      });
    }
    return invoke<StockPriceResponse>('get_stock_price', { stockCode });
  };

  const validateStockCode = async (stockCode: string): Promise<boolean> => {
    if (!isTauri()) {
      // 模拟验证
      return Promise.resolve(stockCode.length === 6);
    }
    return invoke<boolean>('validate_stock_code', { stockCode });
  };

  // 股票搜索功能
  const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
    if (!isTauri()) {
      // 在网页模式下也尝试调用真实API
      try {
        return await fetchRealStockSearch(query);
      } catch (error) {
        console.error('真实API搜索失败，使用模拟数据:', error);
        return getMockStockSearch(query);
      }
    }
    try {
      return await invoke<StockSearchResult[]>('search_stocks', { query });
    } catch (error) {
      console.error('搜索股票失败:', error);
      // 如果Tauri命令失败，返回模拟数据作为后备
      return getMockStockSearch(query);
    }
  };

  // 获取股票详细信息
  const getStockInfo = async (stockCode: string): Promise<StockInfo> => {
    if (!isTauri()) {
      // 在网页模式下也尝试调用真实API
      try {
        return await fetchRealStockInfo(stockCode);
      } catch (error) {
        console.error('真实API获取股票信息失败，使用模拟数据:', error);
        return getMockStockInfo(stockCode);
      }
    }
    try {
      return await invoke<StockInfo>('get_stock_info', { stockCode });
    } catch (error) {
      console.error('获取股票信息失败:', error);
      // 如果Tauri命令失败，返回模拟数据作为后备
      return getMockStockInfo(stockCode);
    }
  };

  // 价格计算命令
  const calculatePriceTargets = async (
    tradeId: number,
    buyStepPercentage: number,
    annualReturnRate: number
  ): Promise<PriceCalculation> => {
    if (!isTauri()) {
      // 模拟计算
      const mockTrade = {
        buyPrice: 10.0,
        buyTime: new Date("2024-01-15T10:30:00"),
      };
      
      const daysHeld = Math.floor((Date.now() - mockTrade.buyTime.getTime()) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.max(daysHeld, 30);
      const sellTarget = mockTrade.buyPrice * (1 + annualReturnRate / 360) * effectiveDays;
      const buyTarget = sellTarget * (1 - buyStepPercentage);
      const currentPrice = mockTrade.buyPrice * (0.95 + Math.random() * 0.1);
      
      return Promise.resolve({
        sellTargetPrice: sellTarget,
        buyTargetPrice: buyTarget,
        daysSincePurchase: daysHeld,
        currentPrice,
        priceReached: currentPrice >= sellTarget ? 'sell' : 
                     currentPrice <= buyTarget ? 'buy' : 'none',
      });
    }
    return invoke<PriceCalculation>('calculate_price_targets', {
      tradeId,
      buyStepPercentage,
      annualReturnRate,
    });
  };

  // 设置相关命令
  const getSetting = async (key: string): Promise<string | null> => {
    if (!isTauri()) {
      // 模拟设置
      const mockSettings: Record<string, string> = {
        'buy_step_percentage': '0.05',
        'annual_return_rate': '0.20',
        'notification_enabled': 'true',
        'sound_enabled': 'true',
      };
      return Promise.resolve(mockSettings[key] || null);
    }
    return invoke<string | null>('get_setting', { key });
  };

  const setSetting = async (key: string, value: string): Promise<void> => {
    if (!isTauri()) {
      return Promise.resolve();
    }
    return invoke('set_setting', { key, value });
  };

  // 通知相关命令
  const sendNotification = async (title: string, body: string, icon?: string): Promise<void> => {
    if (!isTauri()) {
      // 在网页模式下使用浏览器通知API
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon });
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            new Notification(title, { body, icon });
          }
        }
      }
      return Promise.resolve();
    }
    return invoke('send_notification', { title, body, icon });
  };

  const checkPriceAlertsAndNotify = async (
    buyStepPercentage: number,
    annualReturnRate: number
  ): Promise<string[]> => {
    if (!isTauri()) {
      // 在网页模式下模拟价格检查和通知
      return Promise.resolve([]);
    }
    return invoke<string[]>('check_price_alerts_and_notify', {
      buyStepPercentage,
      annualReturnRate,
    });
  };

  // 问候命令（测试用）
  const greet = async (name: string): Promise<string> => {
    if (!isTauri()) {
      return Promise.resolve(`你好, ${name}! 欢迎使用trader!`);
    }
    return invoke<string>('greet', { name });
  };

  return {
    // 交易记录
    createTrade,
    getAllTrades,
    updateTrade,
    deleteTrade,

    // 股价
    getStockPrice,
    validateStockCode,
    searchStocks,
    getStockInfo,

    // 价格计算
    calculatePriceTargets,

    // 设置
    getSetting,
    setSetting,

    // 通知
    sendNotification,
    checkPriceAlertsAndNotify,

    // 测试
    greet,

    // 工具
    isTauri: isTauri(),
  };
};

// 真实API调用辅助函数（用于网页模式）

// 从东方财富API搜索股票
const fetchRealStockSearch = async (query: string): Promise<StockSearchResult[]> => {
  const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(query)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&markettype=&mktnum=&jys=&classify=&securitytype=&status=&letter=`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const json = await response.json();
  const results: StockSearchResult[] = [];

  if (json.QuotationCodeTable?.Data) {
    for (const item of json.QuotationCodeTable.Data.slice(0, 10)) {
      if (item.Code && item.Name && item.MktNum) {
        const market = item.MktNum === '1' ? 'SH' : item.MktNum === '2' ? 'SZ' : 'OTHER';
        results.push({
          code: item.Code,
          name: item.Name,
          market: market,
          stock_type: '股票'
        });
      }
    }
  }

  return results;
};

// 从新浪财经API获取真实股票信息
const fetchRealStockInfo = async (stockCode: string): Promise<StockInfo> => {
  const formattedCode = formatStockCodeForSina(stockCode);
  const url = `https://hq.sinajs.cn/list=${formattedCode}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();

  // 解析新浪财经返回的数据
  const dataStart = text.indexOf('"');
  const dataEnd = text.lastIndexOf('"');

  if (dataStart === -1 || dataEnd === -1) {
    throw new Error('无法解析股票数据');
  }

  const data = text.substring(dataStart + 1, dataEnd);
  const parts = data.split(',');

  if (parts.length < 10) {
    throw new Error('股票数据格式不正确');
  }

  const name = parts[0];
  const open = parseFloat(parts[1]) || 0;
  const prevClose = parseFloat(parts[2]) || 0;
  const currentPrice = parseFloat(parts[3]) || 0;
  const high = parseFloat(parts[4]) || 0;
  const low = parseFloat(parts[5]) || 0;
  const volume = parseInt(parts[8]) || 0;
  const turnover = parseFloat(parts[9]) || 0;

  const change = currentPrice - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  if (currentPrice <= 0 || !name) {
    throw new Error('无效的股票数据');
  }

  return {
    code: stockCode,
    name,
    currentPrice,
    change,
    changePercent,
    open,
    high,
    low,
    volume,
    turnover,
    timestamp: new Date(),
  };
};

// 格式化股票代码为新浪财经API格式
const formatStockCodeForSina = (stockCode: string): string => {
  if (stockCode.startsWith('6')) {
    return `sh${stockCode}`; // 上海交易所
  } else if (stockCode.startsWith('0') || stockCode.startsWith('3')) {
    return `sz${stockCode}`; // 深圳交易所
  } else {
    return `sh${stockCode}`; // 默认上海交易所
  }
};

// 模拟股票信息数据
const getMockStockInfo = (stockCode: string): StockInfo => {
  const mockStocks: Record<string, any> = {
    '000001': { name: '平安银行', price: 12.50, open: 12.30, high: 12.80, low: 12.20 },
    '000002': { name: '万科A', price: 8.80, open: 8.75, high: 8.95, low: 8.70 },
    '600036': { name: '招商银行', price: 35.20, open: 35.00, high: 35.50, low: 34.80 },
    '000858': { name: '五粮液', price: 128.50, open: 127.80, high: 129.20, low: 127.50 },
    '600519': { name: '贵州茅台', price: 1680.00, open: 1675.00, high: 1690.00, low: 1670.00 },
  };

  const stock = mockStocks[stockCode] || {
    name: '未知股票',
    price: 10.0 + Math.random() * 5,
    open: 10.0,
    high: 11.0,
    low: 9.5
  };

  const change = -0.5 + Math.random();

  return {
    code: stockCode,
    name: stock.name,
    currentPrice: stock.price,
    change: change,
    changePercent: (change / stock.price) * 100,
    open: stock.open,
    high: stock.high,
    low: stock.low,
    volume: Math.floor(Math.random() * 1000000),
    turnover: Math.floor(Math.random() * 100000000),
    timestamp: new Date(),
  };
};

// 模拟股票搜索数据
const getMockStockSearch = (query: string): StockSearchResult[] => {
  const mockStocks = [
    { code: '000001', name: '平安银行', market: 'SZ', stock_type: '股票' },
    { code: '000002', name: '万科A', market: 'SZ', stock_type: '股票' },
    { code: '600036', name: '招商银行', market: 'SH', stock_type: '股票' },
    { code: '000858', name: '五粮液', market: 'SZ', stock_type: '股票' },
    { code: '600519', name: '贵州茅台', market: 'SH', stock_type: '股票' },
    { code: '002415', name: '海康威视', market: 'SZ', stock_type: '股票' },
    { code: '600276', name: '恒瑞医药', market: 'SH', stock_type: '股票' },
  ];

  return mockStocks.filter(stock =>
    stock.code.includes(query) || stock.name.includes(query)
  ).slice(0, 10);
};
