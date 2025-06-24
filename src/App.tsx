import React, { useState, useEffect } from "react";
import { Trade, PriceCalculation, Settings as SettingsType } from "./types";
import { TradeForm } from "./components/TradeForm";
import { TradeList } from "./components/TradeList";
import { Settings } from "./components/Settings";
import { useTauri } from "./hooks/useTauri";
import { PriceCalculator } from "./utils/priceCalculator";
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
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      // 这里将来会调用 Tauri 命令
      // const id = await invoke<number>("create_trade", { trade: tradeData });

      // 暂时使用模拟数据
      const newTrade: Trade = {
        ...tradeData,
        id: Date.now(),
        createdAt: new Date(),
      };
      setTrades(prev => [newTrade, ...prev]);
      setShowTradeForm(false);
    } catch (error) {
      console.error("添加交易记录失败:", error);
    }
  };

  const handleEditTrade = async (tradeData: Omit<Trade, 'id' | 'createdAt'>) => {
    if (!editingTrade) return;

    try {
      // 这里将来会调用 Tauri 命令
      // await invoke("update_trade", { trade: { ...tradeData, id: editingTrade.id } });

      // 暂时使用模拟数据
      setTrades(prev => prev.map(trade =>
        trade.id === editingTrade.id
          ? { ...trade, ...tradeData }
          : trade
      ));
      setEditingTrade(null);
      setShowTradeForm(false);
    } catch (error) {
      console.error("更新交易记录失败:", error);
    }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!confirm("确定要删除这条交易记录吗？")) return;

    try {
      // 这里将来会调用 Tauri 命令
      // await invoke("delete_trade", { id });

      // 暂时使用模拟数据
      setTrades(prev => prev.filter(trade => trade.id !== id));
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
        <h1>trader</h1>
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
        </div>
      </header>

      <main className="app-main">
        <TradeList
          trades={trades}
          priceCalculations={priceCalculations}
          onEdit={handleEditClick}
          onDelete={handleDeleteTrade}
          onCalculatePrice={handleCalculatePrice}
        />
      </main>

      {showTradeForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <TradeForm
              onSubmit={editingTrade ? handleEditTrade : handleAddTrade}
              initialData={editingTrade || undefined}
              onCancel={handleCancelForm}
            />
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
    </div>
  );
}

export default App;
