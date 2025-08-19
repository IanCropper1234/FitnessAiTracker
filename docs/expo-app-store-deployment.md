# TrainPro Expo App Store 部署指南

## 🎯 Expo 部署優勢

使用 Expo 進行 App Store 部署具有以下優勢：
- ✅ **無需 macOS**: 所有建構在雲端完成
- ✅ **簡化流程**: EAS Build 自動處理建構和簽章
- ✅ **快速部署**: 從建構到提交一站式完成
- ✅ **WebView 架構**: 保留 100% 現有 PWA 功能

## 📱 目前配置狀態

### 已完成項目 ✅
- **Expo 專案配置**: `mobile/app.json` 完整設置
- **EAS Build 配置**: `mobile/eas.json` 建構設定完成
- **WebView 應用**: React Native 包裝現有 PWA
- **應用資產**: 圖示、啟動畫面已準備
- **Bundle ID**: `com.trainpro.app`

### 專案結構
```
mobile/
├── App.js                 # 主要 WebView 應用
├── app.json              # Expo 應用配置
├── eas.json              # EAS Build 設定
├── package.json          # 相依套件
└── assets/               # 應用圖示與資產
    ├── icon.png
    ├── splash.png
    └── trainpro-*.svg
```

## 🚀 部署步驟

### 步驟 1: 設置 EAS 專案
```bash
# 安裝 EAS CLI (如果尚未安裝)
npm install -g @expo/cli

# 登入 Expo 帳號
expo login

# 進入 mobile 目錄
cd mobile

# 初始化 EAS 專案
eas build:configure
```

### 步驟 2: 配置 Apple Developer Account
需要準備：
- **Apple Developer Account** ($99/年)
- **App Store Connect 存取權限**
- **Apple ID**: c0109009@gmail.com (已在配置中設定)

### 步驟 3: 建構 iOS 應用
```bash
# 建構生產版本
eas build --platform ios --profile production

# 或建構預覽版本 (內部測試)
eas build --platform ios --profile preview
```

### 步驟 4: 提交到 App Store
```bash
# 自動提交到 App Store Connect
eas submit --platform ios --profile production

# 或手動下載 .ipa 檔案後上傳
```

## 📋 App Store Connect 設置

### 應用基本資訊
- **名稱**: TrainPro
- **Bundle ID**: com.trainpro.app
- **類別**: Health & Fitness
- **最低 iOS 版本**: 13.0+

### 必要資料
- [ ] **App 圖示**: 1024x1024 (已有 icon.png)
- [ ] **截圖**: iPhone 各尺寸截圖
- [ ] **App 描述**: 英文描述
- [ ] **關鍵字**: 健身、訓練、營養追蹤
- [ ] **Privacy Policy**: 隱私政策網址

### 審核資訊
- [ ] **測試帳號**: 提供測試用帳號密碼
- [ ] **審核備註**: 說明 WebView 架構
- [ ] **聯絡資訊**: 開發者聯絡方式

## ⚡ Expo vs Capacitor 比較

| 項目 | Expo (推薦) | Capacitor (目前) |
|------|-------------|------------------|
| **設置複雜度** | 簡單 ⭐⭐ | 複雜 ⭐⭐⭐⭐ |
| **需要 macOS** | ❌ 不需要 | ✅ 必須 |
| **建構環境** | 雲端 EAS Build | 本地 Xcode |
| **部署速度** | 快速 (30 分鐘) | 慢 (4-6 小時) |
| **維護成本** | 低 | 高 |
| **Bundle ID** | com.trainpro.app | com.fitai.app |

## 🔧 設置檢查清單

### EAS 專案設置
- [ ] `expo login` 成功
- [ ] `eas build:configure` 完成
- [ ] 專案 ID 已生成並更新到 `app.json`

### Apple 憑證設置
- [ ] Apple Developer Account 啟用
- [ ] App Store Connect 應用記錄建立
- [ ] Bundle ID `com.trainpro.app` 註冊

### 建構測試
- [ ] `eas build --platform ios --profile preview` 成功
- [ ] 在 TestFlight 測試應用功能
- [ ] WebView 載入 https://trainpro-app.replit.app/ 正常

## 🎯 預期時程

| 階段 | 時間估計 |
|------|----------|
| EAS 專案設置 | 15 分鐘 |
| Apple Developer 設置 | 30 分鐘 |
| 首次建構 | 15-30 分鐘 |
| App Store Connect 設置 | 30 分鐘 |
| 提交審核 | 5 分鐘 |
| **總計** | **1.5-2 小時** |

## 📞 支援與疑難排解

### 常見問題
1. **Bundle ID 衝突**: 修改為唯一 ID
2. **建構失敗**: 檢查 eas.json 配置
3. **憑證問題**: 確認 Apple Developer Account
4. **WebView 載入失敗**: 確認 PWA 網址正確

### 有用資源
- [Expo EAS Build 文件](https://docs.expo.dev/build/introduction/)
- [App Store Connect 指南](https://developer.apple.com/app-store-connect/)
- [TrainPro PWA](https://trainpro-app.replit.app/)

## 🎉 完成後

Expo 部署完成後，您將獲得：
- ✅ 在 App Store 上架的 TrainPro iOS 應用
- ✅ 自動 WebView 包裝現有功能
- ✅ 未來更新只需重新建構和提交
- ✅ 保留所有現有 PWA 功能

---

**建議**: 使用 Expo 方式可以大幅簡化部署流程，從 4-6 小時縮短到 1.5-2 小時，且無需 macOS 環境。