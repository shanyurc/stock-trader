import React, { useState, useEffect } from 'react';
import { Settings as SettingsType } from '../types';

interface SettingsProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  onSave, 
  onClose 
}) => {
  const [formData, setFormData] = useState<SettingsType>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="settings-modal">
      <div className="settings-content">
        <h2>系统设置</h2>
        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h3>价格计算参数</h3>
            
            <div className="form-group">
              <label htmlFor="buyStepPercentage">买入台阶 (%)</label>
              <input
                type="number"
                id="buyStepPercentage"
                name="buyStepPercentage"
                value={formData.buyStepPercentage * 100}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  buyStepPercentage: parseFloat(e.target.value) / 100 || 0
                }))}
                step="0.1"
                min="0"
                max="100"
              />
              <small>当前设置: {typeof formData.buyStepPercentage === 'number' ? (formData.buyStepPercentage * 100).toFixed(1) : '--'}%</small>
            </div>

            <div className="form-group">
              <label htmlFor="annualReturnRate">年化收益率 (%)</label>
              <input
                type="number"
                id="annualReturnRate"
                name="annualReturnRate"
                value={formData.annualReturnRate * 100}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  annualReturnRate: parseFloat(e.target.value) / 100 || 0
                }))}
                step="0.1"
                min="0"
                max="1000"
              />
              <small>当前设置: {typeof formData.annualReturnRate === 'number' ? (formData.annualReturnRate * 100).toFixed(1) : '--'}%</small>
            </div>
          </div>

          <div className="settings-section">
            <h3>通知设置</h3>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="notificationEnabled"
                  checked={formData.notificationEnabled}
                  onChange={handleChange}
                />
                启用桌面通知
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="soundEnabled"
                  checked={formData.soundEnabled}
                  onChange={handleChange}
                />
                启用声音提醒
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h3>备份设置</h3>
            
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="autoBackupEnabled"
                  checked={formData.autoBackupEnabled}
                  onChange={handleChange}
                />
                启用自动备份
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="backupInterval">备份间隔 (小时)</label>
              <input
                type="number"
                id="backupInterval"
                name="backupInterval"
                value={formData.backupInterval}
                onChange={handleChange}
                min="1"
                max="168"
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="oneDriveEnabled"
                  checked={formData.oneDriveEnabled}
                  onChange={handleChange}
                />
                启用 OneDrive 备份
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="webdavEnabled"
                  checked={formData.webdavEnabled}
                  onChange={handleChange}
                />
                启用 WebDAV 备份
              </label>
            </div>

            {formData.webdavEnabled && (
              <>
                <div className="form-group">
                  <label htmlFor="webdavUrl">WebDAV URL</label>
                  <input
                    type="url"
                    id="webdavUrl"
                    name="webdavUrl"
                    value={formData.webdavUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/webdav"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="webdavUsername">用户名</label>
                  <input
                    type="text"
                    id="webdavUsername"
                    name="webdavUsername"
                    value={formData.webdavUsername || ''}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="webdavPassword">密码</label>
                  <input
                    type="password"
                    id="webdavPassword"
                    name="webdavPassword"
                    value={formData.webdavPassword || ''}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              保存设置
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
