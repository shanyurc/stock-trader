// 交易记录类型
export interface Trade {
  id?: number;
  stockCode: string;
  stockName: string;
  buyPrice: number;
  buyTime: Date;
  quantity: number;
  notes?: string;
  createdAt?: Date;
}

// 股票信息类型
export interface Stock {
  code: string;
  name: string;
  currentPrice?: number;
  lastUpdated?: Date;
}

// 用户配置类型
export interface Settings {
  buyStepPercentage: number; // 买入台阶 (a)
  annualReturnRate: number;  // 年化收益率 (b)
  notificationEnabled: boolean;
  soundEnabled: boolean;
  autoBackupEnabled: boolean;
  backupInterval: number; // 小时
  oneDriveEnabled: boolean;
  webdavEnabled: boolean;
  webdavUrl?: string;
  webdavUsername?: string;
  webdavPassword?: string;
}

// 价格计算结果类型
export interface PriceCalculation {
  sellTargetPrice: number;
  buyTargetPrice: number;
  daysSincePurchase: number;
  currentPrice?: number;
  priceReached: 'sell' | 'buy' | 'none';
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 股价 API 响应类型
export interface StockPriceResponse {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

// 股票搜索结果类型
export interface StockSearchResult {
  code: string;
  name: string;
  market: string; // 市场类型：SH、SZ等
  type: string;   // 股票类型
}

// 股票详细信息类型
export interface StockInfo {
  code: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  timestamp: Date;
}
