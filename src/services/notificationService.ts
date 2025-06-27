import { Trade, Settings } from '../types';
import { useTauri } from '../hooks/useTauri';

/**
 * 通知服务
 * 管理价格提醒和系统通知
 */
export class NotificationService {
  private settings: Settings;
  private tauri: ReturnType<typeof useTauri>;
  private intervalId: number | null = null;
  private isRunning = false;

  constructor(settings: Settings) {
    this.settings = settings;
    this.tauri = useTauri();
  }

  /**
   * 更新设置
   */
  updateSettings(settings: Settings) {
    this.settings = settings;
  }

  /**
   * 启动价格监控
   */
  startPriceMonitoring(trades: Trade[], intervalMinutes: number = 5) {
    if (this.isRunning) {
      this.stopPriceMonitoring();
    }

    if (!this.settings.notificationEnabled || trades.length === 0) {
      return;
    }

    this.isRunning = true;
    
    // 立即执行一次检查
    this.checkPriceAlerts(trades);

    // 设置定时检查
    this.intervalId = window.setInterval(() => {
      if (this.isRunning) {
        this.checkPriceAlerts(trades);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`价格监控已启动，每${intervalMinutes}分钟检查一次`);
  }

  /**
   * 停止价格监控
   */
  stopPriceMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('价格监控已停止');
  }

  /**
   * 检查价格提醒
   */
  private async checkPriceAlerts(trades: Trade[]) {
    try {
      if (this.tauri.isTauri) {
        // 在Tauri环境中使用后端检查
        const alerts = await this.tauri.checkPriceAlertsAndNotify(
          this.settings.buyStepPercentage,
          this.settings.annualReturnRate
        );
        
        if (alerts.length > 0) {
          console.log('价格提醒:', alerts);
        }
      } else {
        // 在网页环境中手动检查
        await this.checkPriceAlertsWeb(trades);
      }
    } catch (error) {
      console.error('检查价格提醒失败:', error);
    }
  }

  /**
   * 网页环境下的价格检查
   */
  private async checkPriceAlertsWeb(trades: Trade[]) {
    for (const trade of trades) {
      if (!trade.id) continue;

      try {
        // 获取当前股价
        const stockInfo = await this.tauri.getStockInfo(trade.stockCode);
        
        // 计算价格目标
        const calculation = await this.tauri.calculatePriceTargets(
          trade.id,
          this.settings.buyStepPercentage,
          this.settings.annualReturnRate
        );

        // 检查是否达到目标价格
        if (calculation.priceReached === 'sell') {
          const message = `${trade.stockName}(${trade.stockCode}) 已达到卖出目标价格 ¥${calculation.sellTargetPrice.toFixed(2)}，当前价格 ¥${stockInfo.currentPrice.toFixed(2)}`;
          
          await this.sendNotification('🔔 卖出提醒', message);
          
          // 播放提示音
          if (this.settings.soundEnabled) {
            this.playNotificationSound();
          }
        } else if (calculation.priceReached === 'buy') {
          const message = `${trade.stockName}(${trade.stockCode}) 已达到买入目标价格 ¥${calculation.buyTargetPrice.toFixed(2)}，当前价格 ¥${stockInfo.currentPrice.toFixed(2)}`;
          
          await this.sendNotification('🔔 买入提醒', message);
          
          // 播放提示音
          if (this.settings.soundEnabled) {
            this.playNotificationSound();
          }
        }
      } catch (error) {
        console.error(`检查股票 ${trade.stockCode} 价格失败:`, error);
      }
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(title: string, body: string, icon?: string) {
    if (!this.settings.notificationEnabled) {
      return;
    }

    try {
      await this.tauri.sendNotification(title, body, icon);
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }

  /**
   * 播放提示音
   */
  private playNotificationSound() {
    if (!this.settings.soundEnabled) {
      return;
    }

    try {
      // 创建音频上下文播放提示音
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('播放提示音失败:', error);
    }
  }

  /**
   * 测试通知
   */
  async testNotification() {
    await this.sendNotification(
      '🧪 测试通知',
      '这是一个测试通知，如果您看到这条消息，说明通知功能正常工作。'
    );

    if (this.settings.soundEnabled) {
      this.playNotificationSound();
    }
  }

  /**
   * 获取监控状态
   */
  getMonitoringStatus() {
    return {
      isRunning: this.isRunning,
      notificationEnabled: this.settings.notificationEnabled,
      soundEnabled: this.settings.soundEnabled,
    };
  }
}
