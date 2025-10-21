# 🚀 同步並重新構建 iOS App

## ✅ 已完成的修復

1. ✅ 在 `capacitor.config.ts` 中添加了 `packageClassList`
2. ✅ 包含了 `'IosSwipeBack'` 插件註冊
3. ✅ Swift 插件有 `load()` 診斷方法

---

## 📋 執行步驟（在 Mac 上）

### **步驟 1：拉取最新代碼**

```bash
cd ~/Desktop/FitnessAiTracker
git pull origin main
```

### **步驟 2：同步 Capacitor 配置（關鍵！）**

```bash
npx cap sync ios
```

**這會做什麼**：
- ✅ 從 `capacitor.config.ts` 讀取配置
- ✅ 更新 `ios/App/App/capacitor.config.json`
- ✅ 將 `IosSwipeBack` 註冊到 Capacitor
- ✅ 同步所有 iOS 項目設置

**預期輸出**：
```
✔ Copying web assets from www to ios/App/App/public in 1.23ms
✔ Creating capacitor.config.json in ios/App/App in 847.15μs
✔ copy ios in 5.62ms
✔ Updating iOS plugins in 2.34ms
[info] Found 7 Capacitor plugins for ios:
       @capacitor/app@6.0.2
       @capacitor/browser@6.0.3
       @capacitor/camera@6.1.1
       @capacitor/haptics@6.0.2
       @capacitor/keyboard@6.0.3
       @capacitor/status-bar@6.0.2
       IosSwipeBack (custom)    ← 應該看到這個！
```

### **步驟 3：打開 Xcode**

```bash
npx cap open ios
```

### **步驟 4：確認文件在項目中**

在 Xcode Project Navigator 中：
- ✅ 確保 `WebViewConfig` 文件存在
- ✅ 點擊文件，檢查右側 File Inspector
- ✅ 確保 "Target Membership" → "App" 已勾選

**如果文件不在項目中**：
1. 右鍵點擊 `App` 文件夾
2. "Add Files to 'App'..."
3. 選擇 `ios/App/App/WebViewConfig.swift`
4. ✅ 勾選 "App" target
5. 點擊 "Add"

### **步驟 5：Clean Build Folder**

在 Xcode 中：
- 菜單：**Product → Clean Build Folder**
- 或按：**`⇧⌘K`** (Shift + Command + K)

等待幾秒鐘完成。

### **步驟 6：構建並運行**

在 Xcode 中：
- 菜單：**Product → Run**
- 或按：**`⌘R`** (Command + R)

等待構建完成並在設備/模擬器上啟動。

---

## 🔍 成功的關鍵指標

### **1. 應用啟動時（最重要！）**

在 Xcode Console 中，應該看到：

```
⚡️  WebView loaded
🔌 [IosSwipeBack] Plugin loaded and registered successfully!    ← 這行是關鍵！
```

**如果看到這行**：✅ 插件已成功註冊！

**如果沒看到這行**：❌ 插件未註冊，需要檢查：
- `npx cap sync ios` 是否成功執行
- 文件是否在 Xcode Build Phases → Compile Sources 中

### **2. 導航到 Profile 頁面時**

```
⚡️  [log] - AnimatedPage: Page changed from / to /profile
✅ [IosSwipeBack] Native swipe-back gesture ENABLED
⚡️  [log] - ✅ [useSwipeBack] Swipe back ENABLED
```

### **3. 離開 Profile 頁面時**

```
⚡️  [log] - AnimatedPage: Page changed from /profile to /
🚫 [IosSwipeBack] Native swipe-back gesture DISABLED
⚡️  [log] - 🧹 [useSwipeBack] Cleanup: Swipe back disabled
```

### **4. 測試手勢**

1. 在應用中點擊底部的 **Profile** 按鈕
2. **從螢幕最左邊緣向右滑動**（手指從邊緣 1-2px 開始）
3. ✅ **應該能夠流暢地滑動返回 Dashboard**

---

## 🐛 故障排除

### **情況 1：沒有看到 "Plugin loaded" 日誌**

**可能原因**：
1. ❌ `npx cap sync ios` 沒有成功執行
2. ❌ 文件沒有被編譯到 App target

**解決方案**：
```bash
# 重新同步
npx cap sync ios

# 檢查輸出中是否有 "IosSwipeBack (custom)"

# 在 Xcode 中：
# 1. Project Navigator → 選擇頂部的 "App" (藍色圖標)
# 2. TARGETS → App → Build Phases
# 3. 展開 "Compile Sources"
# 4. 確認 "WebViewConfig.swift" 在列表中
# 5. 如果不在，點擊 "+" 添加它
# 6. Clean Build (⇧⌘K)
# 7. Run (⌘R)
```

### **情況 2：看到 "Plugin loaded" 但仍然 UNIMPLEMENTED**

**這不太可能發生**，但如果發生：
- 檢查 `client/src/hooks/useSwipeBack.ts`
- 確認 `registerPlugin('IosSwipeBack')` 名稱完全匹配

### **情況 3：手勢不工作或不流暢**

**檢查**：
1. 確保從 Dashboard 導航到 Profile（不是直接打開）
2. 從最左邊 1-2px 開始滑動
3. 確保頁面有瀏覽歷史

**測試**：
- Dashboard → Profile → 從左邊緣滑動 → 應該返回 Dashboard

---

## ✅ 完成檢查清單

執行前請確認：

- [ ] ✅ 已拉取最新代碼 (`git pull origin main`)
- [ ] ✅ 已運行 `npx cap sync ios`（看到 IosSwipeBack 註冊）
- [ ] ✅ `WebViewConfig.swift` 在 Project Navigator 中
- [ ] ✅ Target Membership → App 已勾選
- [ ] ✅ 已執行 Clean Build Folder (`⇧⌘K`)
- [ ] ✅ 已重新構建並運行 (`⌘R`)
- [ ] ✅ Console 顯示 `🔌 [IosSwipeBack] Plugin loaded`
- [ ] ✅ Console 顯示 `✅ [IosSwipeBack] ENABLED`
- [ ] ✅ Profile 頁面可以滑動返回

---

## 📞 如果仍然無法解決

請提供：

1. **`npx cap sync ios` 的完整輸出**
2. **Xcode Console 從啟動到導航 Profile 的完整日誌**
3. **是否看到 `🔌 [IosSwipeBack] Plugin loaded` 日誌**
4. **Build Phases → Compile Sources 的截圖**

---

**預期結果**：完成所有步驟後，iOS 原生滑動手勢應該完美運作！🎉

**關鍵**：確保看到 `🔌 [IosSwipeBack] Plugin loaded` 日誌，這證明插件已被 Capacitor 正確註冊。
