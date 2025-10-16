# 🔧 修復 iOS App 顯示舊版本的問題

## 問題診斷

您的 iOS app 顯示舊版本（"Welcome to FitAI"）是因為：

**❌ Capacitor 載入了舊的本地靜態文件，而不是 mytrainpro.com**

---

## ✅ 已修復的配置

### 修改前（錯誤）：
```typescript
const config: CapacitorConfig = {
  webDir: 'dist/public',  // ❌ 指向舊的本地文件
  server: {
    url: 'https://mytrainpro.com'  // 被忽略了！
  }
}
```

### 修改後（正確）：
```typescript
const config: CapacitorConfig = {
  // ✅ 移除 webDir，直接載入遠程 URL
  server: {
    url: 'https://mytrainpro.com'  // ✅ 現在會生效
  }
}
```

---

## 📱 在 Mac 上更新 iOS App

### Step 1: 拉取最新配置

在您的 Mac 上：

```bash
cd /path/to/trainpro

# 拉取最新更改
git pull origin main

# 或重新下載整個項目
```

### Step 2: 清理並同步

```bash
# 清理舊的 iOS 緩存
rm -rf ios/App/App/public

# 同步新配置到 iOS 項目
npx cap sync ios
```

### Step 3: 在 Xcode 中重新建構

```bash
# 開啟 Xcode
npx cap open ios
```

在 Xcode 中：
1. 清理建構：**Product** → **Clean Build Folder** (⌘⇧K)
2. **遞增 Build Number**（例如從 1 → 2）
3. **Product** → **Archive**
4. **Distribute App** → **Upload to App Store Connect**

### Step 4: 測試

在 TestFlight 中：
1. 等待新版本處理完成（5-15 分鐘）
2. 更新到最新 Build
3. 開啟 app
4. ✅ 應該看到 "Welcome to MyTrainPro"

---

## 🔍 驗證配置

### 檢查 Capacitor 配置

```bash
cat capacitor.config.ts | grep -A5 "server:"
```

應該看到：
```typescript
server: {
  url: 'https://mytrainpro.com',
  cleartext: false
}
```

### 檢查是否有舊文件

```bash
ls -la dist/public/
```

應該是空的或不存在。

---

## ⚙️ Capacitor WebDir 工作原理

### 情況 A：有 webDir（舊配置）
```typescript
webDir: 'dist/public'  // ❌ 優先載入本地文件
server: { url: '...' }  // 被忽略
```
**結果：** 載入本地舊文件 ❌

### 情況 B：無 webDir（新配置）
```typescript
// ✅ 沒有 webDir
server: { url: 'https://mytrainpro.com' }
```
**結果：** 載入遠程最新版本 ✅

---

## 🎯 重要概念

### WebView 架構的正確配置

對於 **純 WebView 應用**（載入遠程網站）：

✅ **DO（推薦）：**
- 不設置 `webDir`
- 設置 `server.url` 指向遠程網站
- iOS app 直接載入 mytrainpro.com

❌ **DON'T（錯誤）：**
- 同時設置 `webDir` 和 `server.url`
- 在 `webDir` 放置舊的靜態文件
- 期望 Capacitor "自動切換" 到遠程 URL

### 何時使用 webDir？

只有以下情況才需要 `webDir`：

1. **完全離線的 app**（不需要網路）
2. **混合模式**（某些頁面本地，某些頁面遠程）
3. **開發測試**（載入本地建構的文件）

**我們的情況：** 100% 載入 mytrainpro.com，所以**不需要** webDir。

---

## 🚀 更新後的工作流程

### 日常功能更新（95% 情況）

```bash
# 1. 在 Replit 修改代碼
# 2. 推送到 mytrainpro.com
# 3. ✅ iOS app 自動顯示最新版本
```

**無需重新建構 app！**

### 配置更新（5% 情況）

如果修改了：
- `capacitor.config.ts`
- `ios/App/App/Info.plist`
- 添加新插件

則需要：
```bash
npx cap sync ios
# 在 Xcode 遞增 Build Number 並重新上傳
```

---

## ❓ 常見問題

### Q: 為什麼之前有 webDir？

**A:** 可能是從其他 Capacitor 範例複製的配置。大多數範例假設您要打包本地文件，但我們的架構不同：
- **傳統 Capacitor**：打包本地 SPA（webDir）
- **我們的架構**：載入遠程網站（server.url）

### Q: app 會離線工作嗎？

**A:** 不會，需要網路連接才能載入 mytrainpro.com。如果需要離線功能：
- 在 Web 端實現 Service Worker
- 使用 PWA 緩存策略
- 不需要修改 Capacitor 配置

### Q: 如何確認 app 載入的是遠程 URL？

**A:** 在 Mac Safari 調試：
1. 連接 iPhone
2. Safari → **開發** → **您的 iPhone** → **MyTrainPro**
3. 在 Console 執行：`console.log(window.location.href)`
4. 應該看到：`https://mytrainpro.com/`

---

## 📋 檢查清單

在重新建構前，確認：

- [ ] `capacitor.config.ts` 中**沒有** `webDir` 配置
- [ ] `server.url` 設置為 `https://mytrainpro.com`
- [ ] `dist/public/` 目錄是空的（或刪除）
- [ ] 執行了 `npx cap sync ios`
- [ ] 在 Xcode 遞增了 Build Number
- [ ] 清理了 Xcode 建構緩存（⌘⇧K）

---

**🎉 完成這些步驟後，您的 iOS app 將永遠顯示 mytrainpro.com 的最新版本！**
