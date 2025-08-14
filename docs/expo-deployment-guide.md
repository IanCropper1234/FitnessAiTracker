# FlexSync iOS App Store 部署指南 - Expo 方案

## 概述
使用 Expo 的 WebView 混合方案，將現有的 React PWA 包裝成原生 iOS 應用程式，快速提交到 App Store。

## 已完成的準備工作

### 1. Expo 專案結構
- ✅ 創建 `mobile/` 目錄
- ✅ 配置 `app.json` 與應用程式元數據
- ✅ 設置 WebView 包裝器 (`App.js`)
- ✅ 安裝必要依賴 (expo-web-browser, expo-status-bar)

### 2. 應用程式資源
- ✅ 應用程式圖標 (`assets/icon.png`) - 1024x1024
- ✅ 啟動頁面 (`assets/splash.png`) - 1284x2778
- ✅ Babel 配置 (`babel.config.js`)

### 3. EAS Build 配置
- ✅ 創建 `eas.json` 配置文件
- ✅ 定義開發、預覽、生產構建配置

## 部署步驟

### 步驟 1: 設置 EAS CLI
```bash
cd mobile
npx eas login
npx eas build:configure
```

### 步驟 2: iOS 構建
```bash
# 開發構建（用於測試）
npx eas build --platform ios --profile development

# 生產構建（用於 App Store）
npx eas build --platform ios --profile production
```

### 步驟 3: App Store 提交
```bash
# 自動提交到 App Store Connect
npx eas submit --platform ios

# 或手動上傳 .ipa 文件到 App Store Connect
```

## 應用程式配置

### WebView 設置
- URL: `https://06480408-c2d8-4ed1-9930-a2a5f8dc92fd-00-3c6lztu4xeqmc.riker.replit.dev/`
- 啟用 cookies 共享
- 支持導航手勢
- 自動調整狀態列

### App Store 資訊
- **應用程式名稱**: FlexSync
- **Bundle ID**: com.flexsync.app
- **版本**: 1.0.0
- **類別**: Health & Fitness
- **描述**: AI-powered fitness and nutrition platform with personalized coaching and comprehensive tracking.

## 技術優勢

### Expo 混合方案優點
1. **快速部署**: 2小時內完成 App Store 提交
2. **零原生開發**: 無需 Swift/Objective-C 知識
3. **保持功能完整**: 100% 保留現有 PWA 功能
4. **自動更新**: Web 端更新即時反映到應用程式
5. **跨平台**: 同時支持 iOS 和 Android

### 與 Capacitor 比較
- ❌ Capacitor: 需要 Xcode 配置、複雜的原生集成
- ✅ Expo: 雲端構建、自動化流程、即開即用

## 發布清單

### App Store Connect 要求
- [ ] Apple Developer 帳戶 ($99/年)
- [ ] 應用程式圖標 (1024x1024)
- [ ] 應用程式截圖 (多種尺寸)
- [ ] 應用程式描述和關鍵字
- [ ] 隱私政策 URL
- [ ] 支持 URL

### 建議的應用程式截圖
1. 儀表板主頁面
2. 營養追蹤頁面
3. 訓練計劃頁面
4. AI 推薦頁面
5. 進度分析頁面

## 預估時間線
- **立即**: Expo 構建和測試 (30分鐘)
- **今天**: App Store Connect 設置和提交 (1小時)
- **1-2天**: Apple 審查和批准
- **總計**: 2-3天從開發到上架

## 支持和維護
- Web 端更新自動反映
- 原生包裝僅在重大更改時需要重新構建
- 無需維護複雜的原生代碼庫

## 下一步行動
1. 執行 `npx eas build --platform ios --profile production`
2. 獲取構建的 .ipa 文件
3. 提交到 App Store Connect
4. 等待 Apple 審查批准

此方案提供最快速、最簡單的 iOS App Store 部署路徑，同時保持所有現有功能。