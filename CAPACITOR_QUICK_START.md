# ⚡ Capacitor 快速入門

## 🎯 核心概念

### Capacitor 是什麼？

**Capacitor = iOS WebView Wrapper（網頁包裝器）**

簡單說：它就是一個**原生 iOS app 裡嵌入了一個 Safari 瀏覽器**，載入 mytrainpro.com。

```
┌─────────────────────────┐
│  iOS App (Capacitor)    │
│  ┌───────────────────┐  │
│  │   WebView         │  │
│  │   (Safari)        │  │
│  │                   │  │
│  │ mytrainpro.com    │  │
│  │                   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 為什麼這很棒？

✅ **不需要原生 OAuth 代碼** - 直接用 Web OAuth
✅ **Cookies 自動工作** - 登入狀態自動保存
✅ **無限建構次數** - 本地 Xcode 建構
✅ **立即更新 Web 內容** - 不需重新建構 app

---

## 📂 項目結構

```
trainpro/
├── capacitor.config.ts    # Capacitor 主配置
├── ios/                    # iOS 原生項目（在 Mac 上建構）
│   └── App/
│       ├── App.xcworkspace  # 用 Xcode 打開此文件
│       └── App/
│           └── Info.plist   # iOS 配置（權限、URL scheme）
├── dist/public/            # Web 建構輸出（Vite）
├── client/                 # React Web App
└── server/                 # Node.js Backend
```

---

## 🔄 工作流程

### 在 Replit 開發（大部分時間）

99% 的時間您只需要：

1. **修改代碼**：`client/` 或 `server/`
2. **推送到 mytrainpro.com**
3. **✅ 完成！** iOS app 自動顯示最新版本

**無需重新建構 iOS app！**

### 何時需要本地 Mac 建構？

只有以下情況需要：

1. ⚙️ 修改了 `capacitor.config.ts`
2. ⚙️ 修改了 `ios/App/App/Info.plist`
3. ⚙️ 添加了新的 Capacitor 插件
4. 🚀 首次上傳到 TestFlight

**95% 的功能變更不需要重新建構！**

---

## 🛠️ 常用命令

### 在 Replit（線上開發）

```bash
# 開發服務器（自動運行）
npm run dev

# 建構 Web 內容
npm run build

# 同步 Web 內容到 iOS 項目
npx cap sync ios
```

### 在本地 Mac（建構 iOS）

```bash
# 1. 複製專案到 Mac
git clone https://github.com/your-username/trainpro.git
cd trainpro
npm install

# 2. 同步最新 Web 內容
npx cap sync ios

# 3. 開啟 Xcode
npx cap open ios

# 4. 在 Xcode 中建構並上傳到 TestFlight
# （按照 CAPACITOR_BUILD_GUIDE.md 的 Step 4-5）
```

---

## 🔧 開發模式

### 模式 1：載入生產網站（預設）

**配置（capacitor.config.ts）：**
```typescript
server: {
  url: 'https://mytrainpro.com',
  cleartext: false
}
```

**使用場景：** 正式版 app，載入線上網站

### 模式 2：載入本地開發服務器

**配置（capacitor.config.ts）：**
```typescript
server: {
  url: 'http://localhost:5000',  // 或 Replit dev URL
  cleartext: true
}
```

**使用場景：** 在真機測試本地代碼變更

**⚠️ 記得切回模式 1 再上傳 TestFlight！**

---

## 🔐 OAuth 如何運作？

### 簡化架構

```
用戶點擊「Google 登入」
    ↓
WebView 導航到 mytrainpro.com/api/auth/google
    ↓
重定向到 Google OAuth 頁面
    ↓
用戶授權
    ↓
Google 重定向回 mytrainpro.com/api/auth/google/callback
    ↓
後端創建 session，設定 cookie
    ↓
✅ WebView 自動保存 cookie
    ↓
用戶已登入！
```

### 關鍵優勢

✅ **100% Web OAuth** - 後端已實現
✅ **零原生代碼** - 不需要 Expo、React Native 插件
✅ **自動 Cookie 管理** - Capacitor 自動處理
✅ **跨平台一致** - iOS、Web、Android（未來）使用同一套代碼

---

## 📱 建構流程摘要

### 首次上傳 TestFlight

1. **在 Replit**：確保代碼已推送到 mytrainpro.com
2. **下載代碼到 Mac**
3. **在 Mac 終端機**：
   ```bash
   cd trainpro
   npm install
   npx cap sync ios
   npx cap open ios
   ```
4. **在 Xcode**：
   - 選擇 Team
   - 設定 Bundle ID: `com.trainpro.app`
   - Archive → Upload to App Store Connect
5. **在 App Store Connect**：
   - 等待建構處理完成
   - 添加測試者 Email
   - 測試者收到 TestFlight 邀請

### 後續更新

**如果只改 Web 內容（大部分情況）：**
- ✅ 直接推送到 mytrainpro.com
- ✅ 用戶刷新 app 即可看到

**如果改了原生配置：**
- 在 Xcode 遞增 Build Number（1 → 2 → 3...）
- 重新 Archive → Upload

---

## 🎯 實用技巧

### 1️⃣ 快速測試 Web 變更

不需要建構 iOS app！
- 推送到 mytrainpro.com
- 在 iPhone Safari 測試
- 確認無誤後，用戶在 app 刷新即可

### 2️⃣ 檢查 iOS app 載入的 URL

在 `capacitor.config.ts` 添加：
```typescript
ios: {
  appendUserAgent: 'MyTrainPro-iOS/1.0.0'
}
```

後端可以檢測 `user-agent` 來識別 iOS app 請求。

### 3️⃣ 調試 WebView

在 Mac Safari：
1. Safari → **開發** → **您的 iPhone**
2. 選擇 MyTrainPro 的 WebView
3. 就像調試網頁一樣！

---

## ❓ 常見問題

### Q: 如何更新 app 內容？

**A:** 直接更新 mytrainpro.com！
- 修改 `client/` 或 `server/`
- `npm run build` 和部署
- app 自動載入最新版本

### Q: 需要重新建構的情況？

**A:** 只有以下情況：
- 修改 Capacitor 配置
- 修改 Info.plist
- 添加新插件
- 修改 app icon 或名稱

### Q: OAuth 會在 app 中正常工作嗎？

**A:** 會！因為：
- WebView 就是 Safari
- OAuth 流程在 Web 端完成
- Cookies 自動保存
- 完全透明無感

### Q: 如何測試 Google 登入？

**A:** 
1. 在 TestFlight 安裝 app
2. 點擊「Sign in with Google」
3. WebView 會打開 Google 授權頁面
4. 授權後自動跳回 app
5. ✅ 已登入！

---

## 📞 更多資源

- **完整建構指南**：`CAPACITOR_BUILD_GUIDE.md`
- **Capacitor 官方文檔**：https://capacitorjs.com/docs
- **問題回報**：在項目 GitHub 創建 Issue

---

**🚀 準備好了嗎？開始建構您的第一個 iOS app 吧！**
