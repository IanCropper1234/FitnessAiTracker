# TrainPro iOS 部署檢查清單

## ✅ 品牌重塑完成項目
- [x] 應用程式名稱更新為 "TrainPro"
- [x] Bundle ID 更改為 com.trainpro.app
- [x] 所有 6 種語言翻譯更新
- [x] PWA manifest.json 更新
- [x] localStorage keys 更新 (trainpro-theme, trainpro-language)
- [x] Expo 配置 (app.json) 更新
- [x] EAS Build 配置完成
- [x] 品牌指南文檔創建
- [x] 新 logo 設計 (TP) 完成

## 📱 iOS App Store 部署步驟

### 前置要求
- [ ] Apple Developer Account ($99/年)
- [ ] App Store Connect 設置
- [ ] 應用程式圖標 (1024x1024)
- [ ] 應用程式截圖 (各種 iPhone 尺寸)

### EAS Build 流程
```bash
cd mobile
npm install -g @expo/cli eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
```

### App Store 提交
```bash
eas submit --platform ios
```

### 必要更新項目
1. **更新 eas.json** 中的 Apple 資訊：
   - appleId: 您的 Apple ID 電子郵件
   - ascAppId: App Store Connect 應用程式 ID
   - appleTeamId: Apple Developer 團隊 ID

2. **應用程式資產**：
   - 新增 TrainPro 圖標到 mobile/assets/
   - 準備各種尺寸的應用程式圖標
   - 創建啟動畫面

3. **App Store 資訊**：
   - 應用程式描述
   - 關鍵字優化
   - 隱私政策 URL
   - 支援 URL

## 🎯 TrainPro 定位策略
- **目標用戶**: 中高級健身愛好者、健美運動員
- **核心賣點**: AI 驅動的專業級訓練體驗
- **競爭優勢**: Renaissance Periodization 方法論
- **App Store 類別**: Health & Fitness

## 🚀 部署時間線
- **總預估時間**: 2-4 小時
- **EAS Build**: 30-60 分鐘
- **App Store 審核**: 24-48 小時
- **正式上線**: 審核通過後即時

## 📋 後續計劃
1. App Store 優化 (ASO)
2. 用戶反饋收集
3. 功能迭代開發
4. 市場推廣策略