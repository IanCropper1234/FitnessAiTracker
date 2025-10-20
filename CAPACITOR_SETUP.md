# Capacitor Browser Plugin 安裝指南

## 為什麼需要這個插件？

iOS 系統不信任從 WebView 直接打開外部瀏覽器的請求。我們需要使用官方的 Capacitor Browser plugin 來安全地打開 OAuth 登錄頁面。

## 安裝步驟（在 MacBook 上執行）

### 1. 安裝 Browser Plugin

```bash
cd ~/FitnessAiTracker
npm install @capacitor/browser
```

### 2. 同步到 iOS 項目

```bash
npx cap sync ios
```

### 3. Xcode Clean Build

在 Xcode 中：
- 按 **⇧⌘K** (Shift + Command + K)
- 然後重新構建並運行

## 驗證安裝

安裝成功後，日誌中將不會再出現：
```
[Auth] Browser.open() failed: {"code":"UNIMPLEMENTED"}
```

而是會顯示：
```
[Auth] Successfully opened OAuth flow in external browser
```

## 完整的構建流程

```bash
# 1. 拉取最新代碼
cd ~/FitnessAiTracker
git pull origin main

# 2. 安裝 Browser Plugin（如果尚未安裝）
npm install @capacitor/browser

# 3. 同步到 iOS
npx cap sync ios

# 4. 在 Xcode 中 Clean Build 並運行
```

## 如果仍然無法工作

確保 `package.json` 中包含：
```json
{
  "dependencies": {
    "@capacitor/browser": "^6.0.0"
  }
}
```

然後重新執行上述步驟。

## 無限循環修復

這個版本的代碼已經修復了無限循環問題：
- 使用 `fetch()` API 調用 session 恢復端點，而不是 `window.location.href` 重定向
- 在成功恢復後使用 `window.location.replace('/')` 導航，避免重新處理 deep link
- 添加了 session 成功標記，防止重複處理同一個 OAuth session
