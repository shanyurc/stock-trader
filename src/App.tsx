import { useState, useEffect } from "react";
import { Trade, PriceCalculation, Settings as SettingsType } from "./types";
import { TradeForm } from "./components/TradeForm";
import { TradeList } from "./components/TradeList";
import { Settings } from "./components/Settings";
import { PortfolioAnalysis } from "./components/PortfolioAnalysis";
import { PriceAlerts } from "./components/PriceAlerts";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StockSelectTest } from "./components/StockSelectTest";
import { useTauri } from "./hooks/useTauri";
import "./App.css";

function App() {
  const tauri = useTauri();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [priceCalculations, setPriceCalculations] = useState<Record<number, PriceCalculation>>({});
  const [settings, setSettings] = useState<SettingsType>({
    buyStepPercentage: 0.05,
    annualReturnRate: 0.20,
    notificationEnabled: true,
    soundEnabled: true,
    autoBackupEnabled: false,
    backupInterval: 24,
    oneDriveEnabled: false,
    webdavEnabled: false,
  });
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTestMode, setShowTestMode] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trades' | 'analysis' | 'alerts'>('trades');

  // 数据加载
  useEffect(() => {
    loadTrades();
    loadSettings();
  }, []);

  const loadTrades = async () => {
    try {
      setIsLoading(true);
      const result = await tauri.getAllTrades();
      setTrades(result);
    } catch (error) {
      console.error("加载交易记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // 这里将来会调用 Tauri 命令加载设置
      // const buyStep = await invoke<string>("get_setting", { key: "buy_step_percentage" });
      // const annualReturn = await invoke<string>("get_setting", { key: "annual_return_rate" });
      // 暂时使用默认设置
    } catch (error) {
      console.error("加载设置失败:", error);
    }
  };

  const handleAddTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    try {
      if (tauri.isTauri) {
        // 使用 Tauri 命令保存到数据库
        const tradeToSave = {
          ...tradeData,
          id: undefined, // 让数据库自动生成ID
          createdAt: new Date(),
        };
        await tauri.createTrade(tradeToSave);
        // 重新加载数据以获取最新的交易记录
        await loadTrades();
      } else {
        // 网页版使用模拟数据
        const newTrade: Trade = {
          ...tradeData,
          id: Date.now(),
          createdAt: new Date(),
        };
        setTrades(prev => [newTrade, ...prev]);
      }
      setShowTradeForm(false);
    } catch (error) {
      console.error("添加交易记录失败:", error);
    }
  };

  const handleEditTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    if (!editingTrade) return;

    try {
      if (tauri.isTauri) {
        // 使用 Tauri 命令更新数据库
        const updatedTrade = {
          ...editingTrade,
          ...tradeData
        };
        await tauri.updateTrade(updatedTrade);
        // 重新加载数据
        await loadTrades();
      } else {
        // 网页版使用模拟数据
        setTrades(prev => prev.map(trade =>
          trade.id === editingTrade.id
            ? { ...trade, ...tradeData }
            : trade
        ));
      }
      setEditingTrade(null);
      setShowTradeForm(false);
    } catch (error) {
      console.error("更新交易记录失败:", error);
    }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!confirm("确定要删除这条交易记录吗？")) return;

    try {
      if (tauri.isTauri) {
        // 使用 Tauri 命令删除
        await tauri.deleteTrade(id);
        // 重新加载数据
        await loadTrades();
      } else {
        // 网页版使用模拟数据
        setTrades(prev => prev.filter(trade => trade.id !== id));
      }
      setPriceCalculations(prev => {
        const newCalc = { ...prev };
        delete newCalc[id];
        return newCalc;
      });
    } catch (error) {
      console.error("删除交易记录失败:", error);
    }
  };

  const handleCalculatePrice = async (tradeId: number) => {
    try {
      // 这里将来会调用 Tauri 命令
      // const calculation = await invoke<PriceCalculation>("calculate_price_targets", {
      //   tradeId,
      //   buyStepPercentage: settings.buyStepPercentage,
      //   annualReturnRate: settings.annualReturnRate,
      // });

      // 暂时使用模拟计算
      const trade = trades.find(t => t.id === tradeId);
      if (!trade) return;

      const daysHeld = Math.floor((Date.now() - new Date(trade.buyTime).getTime()) / (1000 * 60 * 60 * 24));
      const effectiveDays = Math.max(daysHeld, 30);
      const sellTarget = trade.buyPrice * (1 + settings.annualReturnRate / 360) * effectiveDays;
      const buyTarget = sellTarget * (1 - settings.buyStepPercentage);
      const currentPrice = trade.buyPrice * (0.95 + Math.random() * 0.1); // 模拟当前价格

      const calculation: PriceCalculation = {
        sellTargetPrice: sellTarget,
        buyTargetPrice: buyTarget,
        daysSincePurchase: daysHeld,
        currentPrice,
        priceReached: currentPrice >= sellTarget ? 'sell' :
                     currentPrice <= buyTarget ? 'buy' : 'none',
      };

      setPriceCalculations(prev => ({
        ...prev,
        [tradeId]: calculation,
      }));
    } catch (error) {
      console.error("计算价格目标失败:", error);
    }
  };

  const handleSaveSettings = async (newSettings: SettingsType) => {
    try {
      // 这里将来会调用 Tauri 命令保存设置
      // await invoke("set_setting", { key: "buy_step_percentage", value: newSettings.buyStepPercentage.toString() });
      // await invoke("set_setting", { key: "annual_return_rate", value: newSettings.annualReturnRate.toString() });

      setSettings(newSettings);
      setShowSettings(false);
    } catch (error) {
      console.error("保存设置失败:", error);
    }
  };

  const handleEditClick = (trade: Trade) => {
    setEditingTrade(trade);
    setShowTradeForm(true);
  };

  const handleCancelForm = () => {
    setEditingTrade(null);
    setShowTradeForm(false);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1>股票交易记录</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowTradeForm(true)}
            className="btn-primary"
          >
            添加交易记录
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="btn-secondary"
          >
            设置
          </button>
          <button
            onClick={() => setShowTestMode(true)}
            className="btn-secondary"
            style={{ backgroundColor: '#ff6b6b' }}
          >
            测试模式
          </button>
        </div>
      </header>

      {/* 标签页导航 */}
      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          📊 交易记录
        </button>
        <button
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📈 投资组合分析
        </button>
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 价格提醒
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'trades' && (
          <TradeList
            trades={trades}
            priceCalculations={priceCalculations}
            onEdit={handleEditClick}
            onDelete={handleDeleteTrade}
            onCalculatePrice={handleCalculatePrice}
          />
        )}

        {activeTab === 'analysis' && (
          <PortfolioAnalysis
            trades={trades}
            settings={settings}
            onRefresh={loadTrades}
          />
        )}

        {activeTab === 'alerts' && (
          <PriceAlerts
            trades={trades}
            settings={settings}
            onTradeClick={handleEditClick}
          />
        )}
      </main>

      {showTradeForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ErrorBoundary>
              <TradeForm
                onSubmit={editingTrade ? handleEditTrade : handleAddTrade}
                initialData={editingTrade || undefined}
                onCancel={handleCancelForm}
              />
            </ErrorBoundary>
          </div>
        </div>
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTestMode && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>股票选择功能测试</h2>
              <button
                onClick={() => setShowTestMode(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>
            <ErrorBoundary>
              <StockSelectTest />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
