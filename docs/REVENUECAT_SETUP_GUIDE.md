# RevenueCat + iOS In-App Purchase 實作準備指南

> **TrainPro AI Credits 訂閱系統配置步驟**  
> 完成這些步驟後再開始技術實作

---

## 📋 總覽

在開始實作 iOS 應用內購買前，需要完成以下準備工作：

- ⏱️ **預估時間**: 40-60 分鐘
- 🔑 **需要權限**: Apple Developer Account ($99/年), RevenueCat 免費賬號
- 📱 **目標**: 配置訂閱產品、API 整合、測試環境

---

## ✅ 步驟 1: Apple Developer Console 配置

### 1.1 創建訂閱產品

1. 登入 [App Store Connect](https://appstoreconnect.apple.com)
2. 選擇你的 app: **MyTrainPro** (Bundle ID: `com.trainpro.app`)
3. 進入 **Features → In-App Purchases**
4. 點擊 **"+"** 創建以下產品：

#### 建議產品配置

| 產品類型 | Reference Name | Product ID | 價格 | 說明 |
|---------|---------------|------------|------|------|
| Auto-Renewable Subscription | Pro Monthly | `trainpro_pro_monthly` | $9.99 | 每月訂閱 |
| Auto-Renewable Subscription | Pro Yearly | `trainpro_pro_yearly` | $99.99 | 年度訂閱 |
| Consumable | 100 AI Credits | `trainpro_credits_100` | $4.99 | 一次性購買 |
| Consumable | 500 AI Credits | `trainpro_credits_500` | $19.99 | 一次性購買 |

### 1.2 創建訂閱組（Subscription Group）

1. 在 In-App Purchases 頁面，創建新的 Subscription Group
2. **名稱**: `TrainPro AI Access`
3. 將 `trainpro_pro_monthly` 和 `trainpro_pro_yearly` 加入此組

### 1.3 填寫產品資訊

為每個產品填寫：
- ✅ Display Name（顯示名稱）
- ✅ Description（產品描述）
- ✅ Review Notes（審核備註，可選）
- ✅ Screenshot（產品截圖，可選）

### 1.4 創建沙盒測試賬號

1. 進入 **Users and Access → Sandbox → Testers**
2. 點擊 **"+"** 創建測試 Apple ID
3. 填寫測試賬號資訊：
   - Email: 使用未註冊過 Apple ID 的郵箱
   - Password: 設置測試密碼
   - 地區: United States（或你的目標市場）
4. **記錄測試賬號和密碼**（供 TestFlight 測試使用）

### 📝 完成後記錄

```
✅ Apple 產品清單
- trainpro_pro_monthly (月訂 $9.99)
- trainpro_pro_yearly (年訂 $99.99)
- trainpro_credits_100 (一次性 $4.99)
- trainpro_credits_500 (一次性 $19.99)

✅ 沙盒測試賬號
- Email: ___________________
- Password: ___________________
```

---

## ✅ 步驟 2: RevenueCat 註冊與配置

### 2.1 註冊 RevenueCat

1. 訪問 [RevenueCat](https://www.revenuecat.com)
2. 點擊 **"Sign Up Free"**
3. 使用 Google/GitHub 或 Email 註冊
4. 選擇 **Free Plan**（每月 $10k 追蹤收入免費）

### 2.2 創建項目

1. Dashboard → **Create New Project**
2. 項目名稱: **TrainPro**
3. 選擇平台: **iOS**

### 2.3 配置 iOS App

1. **Bundle ID**: `com.trainpro.app` ⚠️ 必須與 app.json 完全一致
2. **App Name**: MyTrainPro

### 2.4 連接 App Store Connect（重要！）

#### 方式 A: App Store Connect API Key（推薦）

**在 Apple Developer Console：**

1. 前往 [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/api)
2. 點擊 **"+"** 生成 API Key
3. 填寫資訊：
   - Name: `RevenueCat Integration`
   - Access: **Admin** 或 **App Manager**
4. 點擊 **Generate**
5. **立即下載 .p8 私鑰文件**（⚠️ 只能下載一次！妥善保存）
6. 記錄以下資訊：
   - **Key ID**: 例如 `ABC123XYZ`
   - **Issuer ID**: 在頁面頂部顯示
   - **.p8 文件內容**: 打開文件複製所有內容

**在 RevenueCat Dashboard：**

1. 進入 **Project Settings → Apple App Store**
2. 選擇 **"App Store Connect API"**
3. 填入：
   - Key ID
   - Issuer ID
   - 上傳或貼上 .p8 文件內容
4. 點擊 **Save**

#### 方式 B: Shared Secret（較簡單但功能受限）

1. App Store Connect → My Apps → MyTrainPro
2. App Information → **App-Specific Shared Secret**
3. 點擊 **"Generate"**
4. 複製 Shared Secret
5. 在 RevenueCat 貼上

### 📝 完成後記錄

```
✅ RevenueCat API Keys
- Public API Key (iOS): appl_____________________
- Secret API Key: sk_____________________

（在 RevenueCat Dashboard → API Keys 中找到）
```

---

## ✅ 步驟 3: 在 RevenueCat 配置產品

### 3.1 導入產品

1. RevenueCat Dashboard → **Products**
2. 點擊 **"+ New"**
3. 選擇 **"Import from App Store Connect"**
4. 等待自動同步（可能需要 5-10 分鐘）
5. 確認所有步驟 1 創建的產品已導入

### 3.2 創建 Entitlements（權限）

進入 **Entitlements** 頁面，創建以下權限：

| Entitlement ID | Display Name | 用途 |
|---------------|-------------|------|
| `pro` | Pro Access | 訂閱用戶專屬功能 |
| `credits_100` | 100 Credits | 一次性購買 100 credits |
| `credits_500` | 500 Credits | 一次性購買 500 credits |

### 3.3 創建 Offerings

1. 進入 **Offerings** 頁面
2. 創建 **"Default Offering"**
3. 添加 Packages：

**Subscription Packages:**
- Package ID: `monthly`
  - 產品: `trainpro_pro_monthly`
  - Entitlement: `pro`

- Package ID: `yearly`
  - 產品: `trainpro_pro_yearly`
  - Entitlement: `pro`

**Credit Packages:**
- Package ID: `credits_100`
  - 產品: `trainpro_credits_100`
  - Entitlement: `credits_100`

- Package ID: `credits_500`
  - 產品: `trainpro_credits_500`
  - Entitlement: `credits_500`

---

## ✅ 步驟 4: 決定 Credits 配額方案

### 方案 A: 訂閱制 + 一次性購買

```
免費用戶: 每日 20 次 AI 請求（不累積，每日重置）
Pro 月訂: 每月 500 credits（可累積最多 2 個月）
Pro 年訂: 每年 6000 credits（可累積）
一次性購買: 永久有效，可疊加
```

**優點**: 清晰易懂，鼓勵訂閱  
**適合**: 大眾用戶

### 方案 B: 純 Credits 系統

```
免費用戶: 註冊贈送 50 credits（用完需購買）
所有購買: 永久有效，無過期時間
訂閱: 每月自動補充 credits
```

**優點**: 靈活，按需付費  
**適合**: 進階用戶

### 方案 C: 混合分層

```
免費層: 每日 15 次（重置）
Pro 層: 無限制基礎功能 + 500 premium credits/月
Elite 層: 完全無限制
```

**優點**: 最靈活，多層級變現  
**適合**: 專業用戶市場

### 📝 完成後記錄

```
✅ Credits 方案選擇
選擇方案: A / B / C
```

---

## ✅ 步驟 5: AI Endpoint Credits 消費定價

建議每個 AI 功能的 credits 消費：

| API Endpoint | 功能 | Credits 消費 | 說明 |
|--------------|------|-------------|------|
| `/api/ai/exercise-recommendations` | AI 運動推薦 | 1.0 | 簡單文字生成 |
| `/api/ai/nutrition-analysis` | AI 營養分析 | 1.5 | 文字分析 |
| `/api/ai/food-analysis` | AI 食物圖片分析 | 3.0 | 單圖片分析 |
| `/api/nutrition/analyze` | 多圖片營養分析 | 5.0 | 多圖片分析 |
| `/api/ai/program-optimization` | AI 訓練優化 | 2.0 | 程序優化 |

**總計 5 個 AI 端點**

---

## ⏭️ 下一步：技術實作

完成以上所有步驟後，提供以下資訊開始技術實作：

### 📝 實作所需資訊清單

```markdown
## Apple Developer Console
- [x] 產品已創建並填寫完整資訊
- [x] 訂閱組已配置
- [x] 沙盒測試賬號已創建
- [x] Product IDs: ___________________

## RevenueCat
- [x] 項目已創建
- [x] App Store Connect API 已連接
- [x] 產品已導入
- [x] Entitlements 已創建
- [x] Offerings 已配置
- [x] Public API Key: ___________________
- [x] Secret API Key: ___________________

## 配額方案
- [x] 已選擇方案: A / B / C
- [x] 已確認 Credits 定價

## 測試環境
- [x] 沙盒賬號: ___________________
- [x] TestFlight 已準備好測試
```

---

## 🆘 常見問題

### Q1: 找不到 In-App Purchases 選項
- 確認 Apple Developer 賬號已付費（$99/年）
- 確認 app 已在 App Store Connect 創建

### Q2: RevenueCat 無法連接 App Store
- 檢查 Bundle ID 是否完全匹配 `com.trainpro.app`
- 確認 API Key 權限為 Admin 或 App Manager

### Q3: 產品無法導入到 RevenueCat
- 等待 5-10 分鐘（Apple 同步有延遲）
- 嘗試手動刷新或重新連接

### Q4: 沙盒測試無法購買
- 確認在設備上已登出正式 App Store 賬號
- 使用步驟 1.4 創建的沙盒賬號登入

---

## 📚 相關文檔

- [RevenueCat 官方文檔](https://docs.revenuecat.com)
- [Apple In-App Purchase 指南](https://developer.apple.com/in-app-purchase/)
- [Expo In-App Purchases](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)

---

## 📊 實作後的功能

完成技術實作後，系統將具備：

✅ 用戶可在 iOS app 內購買訂閱和 credits  
✅ 自動驗證購買收據並更新用戶 credits  
✅ 支援訂閱自動續訂和取消  
✅ Webhook 接收 Apple 通知處理退款  
✅ 前端顯示剩餘 credits 和購買選項  
✅ AI 功能根據 credits 餘額自動限制  
✅ TestFlight 環境完整測試流程  

---

**完成準備後，通知開發團隊開始技術實作！** 🚀
