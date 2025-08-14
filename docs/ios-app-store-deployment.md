# FitAI iOS App Store 部署指南

## 📱 完整的 App Store 上架流程

### 階段一：Replit 準備工作 ✅

1. **Capacitor 配置完成**
   - ✅ 已安裝 Capacitor.js 及相關套件
   - ✅ 已配置 `capacitor.config.ts`
   - ✅ 已建立 iOS 原生專案資料夾
   - ✅ 已同步 web 資源到 iOS 專案

2. **建構最新版本**
   ```bash
   npm run build
   npx cap sync ios
   ```

### 階段二：macOS 本地開發環境設置

#### 必要軟體安裝
1. **Xcode** (從 Mac App Store 下載)
   - 版本：最新穩定版 (15.x+)
   - 需要 Apple Developer Account

2. **CocoaPods** (依賴管理)
   ```bash
   sudo gem install cocoapods
   ```

3. **iOS 模擬器** (Xcode 內建)

#### 專案轉移步驟
1. **下載 Replit 專案**
   ```bash
   git clone <your-replit-repo-url>
   cd fitai-project
   ```

2. **安裝依賴**
   ```bash
   npm install
   cd ios/App
   pod install
   cd ../..
   ```

3. **開啟 Xcode 專案**
   ```bash
   npx cap open ios
   ```

### 階段三：Xcode 配置和測試

#### App 基本資訊設置
1. **Bundle Identifier**: `com.fitai.app`
2. **App Name**: `FitAI`
3. **Version**: `1.0.0`
4. **Build Number**: `1`

#### 必要配置
1. **Signing & Capabilities**
   - 選擇正確的 Development Team
   - 配置 Provisioning Profile
   - 確保 Bundle ID 獨特性

2. **App Icons & Launch Screen**
   - 設置各種尺寸的 App Icons (1024x1024, 180x180 等)
   - 配置 Launch Screen

3. **Privacy 描述**
   - Camera Usage: "用於掃描食物條碼和營養分析"
   - Health Data: "記錄健身和營養數據"

#### 本地測試
1. **iOS 模擬器測試**
   ```bash
   npx cap run ios
   ```

2. **實體設備測試**
   - 連接 iPhone/iPad
   - 在 Xcode 中選擇設備並運行

### 階段四：App Store Connect 準備

#### Developer Account 設置
1. **加入 Apple Developer Program** ($99/年)
2. **創建 App Store Connect 記錄**
   - App 名稱：FitAI
   - Bundle ID：com.fitai.app
   - SKU：FitAI-iOS-001

#### App 元資料準備
1. **App 描述** (英文)
   ```
   FitAI: Your AI-Powered Fitness Coach
   
   Transform your fitness journey with intelligent workout planning and nutrition analysis. FitAI combines cutting-edge AI technology with proven Renaissance Periodization methodology to deliver personalized training programs that adapt to your progress.
   
   Key Features:
   • AI-powered nutrition analysis with micronutrient tracking
   • Personalized workout templates based on RP methodology
   • Progress tracking with comprehensive analytics
   • Intelligent auto-regulation for optimal training
   • Dark mode support for all lighting conditions
   
   Whether you're a beginner or advanced athlete, FitAI provides the tools and insights you need to achieve your fitness goals efficiently and scientifically.
   ```

2. **關鍵字**
   ```
   fitness,workout,nutrition,AI,training,bodybuilding,health,exercise,muscle,diet
   ```

3. **Screenshots 要求**
   - iPhone (6.7", 6.5", 5.5")
   - iPad (12.9", 11")
   - 每種尺寸至少 3 張截圖

### 階段五：建構生產版本

#### Release 建構
1. **配置 Release Scheme**
   ```bash
   # 在 Xcode 中
   Product > Scheme > Edit Scheme > Run > Build Configuration > Release
   ```

2. **Archive 建構**
   ```bash
   Product > Archive
   ```

3. **上傳到 App Store Connect**
   - 使用 Xcode Organizer
   - 選擇 "Distribute App"
   - 選擇 "App Store Connect"

### 階段六：App Store 審核提交

#### 最終檢查清單
- [ ] App 在所有支援設備上正常運行
- [ ] 所有功能已測試（包括 AI 功能）
- [ ] Privacy Policy 已準備
- [ ] App 符合 Apple Human Interface Guidelines
- [ ] 所有必要的 API 金鑰已配置
- [ ] 測試帳號已準備（如需要）

#### 提交審核
1. **在 App Store Connect 中**
   - 選擇建構版本
   - 填寫所有必要資訊
   - 提交審核

2. **預期時程**
   - 審核時間：1-7 天
   - 首次提交可能需要額外時間

### 階段七：上架後維護

#### 持續更新流程
1. **代碼更新**
   ```bash
   # 在 Replit 中開發
   npm run build
   npx cap sync ios
   
   # 轉移到 macOS
   # 在 Xcode 中建構和上傳
   ```

2. **版本管理**
   - 增加 Build Number 用於小更新
   - 增加 Version Number 用於功能更新

## 🔧 現在可以開始的步驟

### 立即行動項目：

1. **下載專案到 macOS**
   - 使用 Git 或直接下載 ZIP
   - 確保所有檔案完整轉移

2. **安裝 Xcode 和 CocoaPods**
   - 從 Mac App Store 安裝 Xcode
   - 終端機執行：`sudo gem install cocoapods`

3. **首次開啟專案**
   ```bash
   cd ios/App
   pod install
   cd ../..
   npx cap open ios
   ```

4. **配置 Developer Account**
   - 在 Xcode 的 Signing & Capabilities 中設置
   - 確保 Bundle ID 可用

5. **測試基本功能**
   - 在模擬器中運行
   - 確認所有主要功能正常

## 📋 所需資源清單

- [ ] Apple Developer Account ($99/年)
- [ ] macOS 設備 (macOS 13+ 推薦)
- [ ] App Icons (1024x1024 主要圖示)
- [ ] Screenshots (各種設備尺寸)
- [ ] App 描述和關鍵字
- [ ] Privacy Policy 網址
- [ ] 測試設備或 Apple ID

## 🎯 成功指標

- ✅ iOS 專案成功建構
- ✅ 在模擬器和實體設備正常運行
- ✅ 所有核心功能測試通過
- ✅ App Store Connect 設置完成
- ✅ 審核提交成功
- 🎉 App Store 正式上架

---

**註記**：此指南假設您有 macOS 環境進行 iOS 開發。如需要其他協助，請隨時詢問。