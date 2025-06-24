# 🖥️ 桌面应用构建指南

## 📋 概述

我们的股票交易记录软件基于 **Tauri** 架构，可以打包成独立的桌面应用程序，完全脱离浏览器运行。

## 🚀 桌面应用优势

### ✅ 与传统桌面应用相同的体验
- **独立窗口**：在独立窗口中运行，不依赖浏览器
- **系统集成**：可以固定到任务栏、创建桌面快捷方式
- **原生性能**：接近原生应用的性能和响应速度
- **小体积**：相比 Electron，体积减少 90%+

### 🔒 安全性优势
- **本地数据**：数据完全存储在本地，不经过网络
- **系统权限**：可以访问系统文件、通知等原生功能
- **无浏览器依赖**：不受浏览器安全限制影响

### 🎯 功能特性
- **桌面通知**：股价达到目标时发送系统通知
- **后台运行**：可以最小化到系统托盘持续监控
- **文件系统访问**：直接读写本地数据库文件
- **系统主题**：自动适配系统深色/浅色主题

## 🛠️ 构建流程

### 前置要求
```bash
# 1. 安装 Node.js (已完成)
node --version  # v18+

# 2. 安装 Rust (正在进行中)
rustc --version  # 1.70+

# 3. 安装系统依赖 (Windows)
# Visual Studio Build Tools 或 Visual Studio Community
```

### 开发模式
```bash
# 启动开发服务器 (热重载)
npm run tauri dev
```

**开发模式特性：**
- 🔥 热重载：前端代码修改后自动刷新
- 🐛 调试模式：可以打开开发者工具调试
- ⚡ 快速迭代：实时查看修改效果

### 生产构建
```bash
# 构建生产版本
npm run tauri build
```

**构建输出：**
```
src-tauri/target/release/
├── stock-trader.exe          # 主程序文件
└── bundle/
    ├── msi/                  # Windows 安装包
    │   └── stock-trader_0.1.0_x64_zh-CN.msi
    └── nsis/                 # NSIS 安装程序
        └── stock-trader_0.1.0_x64-setup.exe
```

## 📦 应用打包配置

### 应用图标
```
src-tauri/icons/
├── 32x32.png
├── 128x128.png
├── 128x128@2x.png
├── icon.icns      # macOS
└── icon.ico       # Windows
```

### 应用信息
```json
{
  "package": {
    "productName": "股票交易记录",
    "version": "0.1.0"
  },
  "bundle": {
    "identifier": "com.stocktrader.app",
    "targets": ["msi", "nsis"]
  }
}
```

## 🎨 桌面应用界面特性

### 窗口配置
- **初始尺寸**：1200x800 像素
- **最小尺寸**：800x600 像素
- **可调整大小**：支持用户调整窗口大小
- **标题栏**：显示应用名称和标准窗口控件

### 系统集成
```rust
// 桌面通知示例
use tauri::api::notification::Notification;

Notification::new(&tauri::generate_context!().config().tauri.bundle.identifier)
    .title("股价提醒")
    .body("平安银行已达到卖出目标价格 ¥15.20")
    .show()?;
```

### 系统托盘 (计划功能)
- 最小化到系统托盘
- 右键菜单快速操作
- 托盘图标状态指示

## 🔧 高级配置

### 自动启动
```rust
// 开机自启动配置
use tauri_plugin_autostart::MacosLauncher;

tauri::Builder::default()
    .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))
```

### 更新机制
```rust
// 自动更新配置
use tauri_plugin_updater::UpdaterExt;

app.handle().updater().check().await?;
```

## 📊 性能对比

| 特性 | Tauri | Electron | 原生应用 |
|------|-------|----------|----------|
| 包体积 | ~15MB | ~150MB | ~5MB |
| 内存占用 | ~50MB | ~200MB | ~30MB |
| 启动速度 | 快 | 中等 | 最快 |
| 开发效率 | 高 | 高 | 中等 |
| 跨平台 | ✅ | ✅ | ❌ |

## 🚀 部署方案

### 1. 直接分发
- 将 `.exe` 文件直接分发给用户
- 用户双击即可运行，无需安装

### 2. 安装包分发
- 使用 `.msi` 或 `-setup.exe` 安装包
- 提供标准的安装/卸载体验
- 自动创建开始菜单和桌面快捷方式

### 3. 应用商店分发
- 可以发布到 Microsoft Store
- 自动更新和安全沙箱

## 🔍 调试和测试

### 开发者工具
```bash
# 在开发模式下按 F12 打开开发者工具
# 或在代码中调用
webview.open_devtools();
```

### 日志记录
```rust
// Rust 后端日志
log::info!("应用启动成功");

// 前端日志
console.log("前端日志信息");
```

### 性能监控
```rust
// 监控内存使用
use sysinfo::{System, SystemExt};
let mut sys = System::new_all();
sys.refresh_all();
println!("内存使用: {} MB", sys.used_memory() / 1024 / 1024);
```

## 📝 下一步计划

1. **完成 Rust 环境安装**
2. **运行开发模式** (`npm run tauri dev`)
3. **测试桌面功能**
4. **构建生产版本** (`npm run tauri build`)
5. **生成安装包**

## 🎯 用户体验

最终用户将获得：
- 📱 **独立桌面应用**：像使用 QQ、微信一样使用
- 🔔 **实时通知**：股价变动及时提醒
- 💾 **本地存储**：数据安全，离线可用
- ⚡ **快速启动**：秒级启动，响应迅速
- 🎨 **现代界面**：美观的用户界面设计

---

**注意**：当前 Rust 环境正在安装中，安装完成后即可开始桌面应用的构建和测试。
