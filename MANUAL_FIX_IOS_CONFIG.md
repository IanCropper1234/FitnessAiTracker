# 🔧 手動添加 IosSwipeBack 到 iOS 配置

## 問題
`npx cap sync ios` 沒有正確同步 `packageClassList`，導致 `IosSwipeBack` 插件沒有被註冊。

## 解決方案：手動編輯配置文件

### **步驟 1：打開配置文件**

在 Mac 上：

```bash
cd ~/Desktop/FitnessAiTracker
open -e ios/App/App/capacitor.config.json
```

這會用 TextEdit 打開文件。

### **步驟 2：找到 `packageClassList` 區域**

在文件中，找到這段：

```json
"packageClassList": [
    "AppPlugin",
    "CAPBrowserPlugin",
    "CAPCameraPlugin",
    "HapticsPlugin",
    "KeyboardPlugin",
    "StatusBarPlugin"
]
```

### **步驟 3：添加 `IosSwipeBack`**

**修改為**：

```json
"packageClassList": [
    "AppPlugin",
    "CAPBrowserPlugin",
    "CAPCameraPlugin",
    "HapticsPlugin",
    "KeyboardPlugin",
    "StatusBarPlugin",
    "IosSwipeBack"
]
```

**注意**：
- ✅ 在 `"StatusBarPlugin"` 後面加逗號 `,`
- ✅ 添加新行 `"IosSwipeBack"`
- ✅ **不要在最後一個加逗號**

### **步驟 4：保存文件**

- **Command + S** 保存
- 關閉 TextEdit

### **步驟 5：驗證修改**

在終端機中執行：

```bash
cat ios/App/App/capacitor.config.json | grep -A 10 packageClassList
```

**應該看到**：

```json
"packageClassList": [
    "AppPlugin",
    "CAPBrowserPlugin",
    "CAPCameraPlugin",
    "HapticsPlugin",
    "KeyboardPlugin",
    "StatusBarPlugin",
    "IosSwipeBack"           ← 確認這個存在！
]
```

### **步驟 6：在 Xcode 中構建**

1. **如果 Xcode 已打開，關閉它**

2. **重新打開 Xcode**：
   ```bash
   npx cap open ios
   ```

3. **確認 `WebViewConfig` 文件在項目中**：
   - 在 Project Navigator 中查看
   - 如果不在，右鍵 "App" 文件夾 → "Add Files to 'App'..." → 選擇 `ios/App/App/WebViewConfig.swift` → ✅ 勾選 "App" target → "Add"

4. **Clean Build Folder**：
   - **Product → Clean Build Folder**
   - 或按 **`⇧⌘K`**

5. **Run**：
   - **Product → Run**
   - 或按 **`⌘R`**

---

## 🔍 **驗證成功**

### **應用啟動時，Console 應該顯示**：

```
⚡️  WebView loaded
🔌 [IosSwipeBack] Plugin loaded and registered successfully!    ← 關鍵！
```

### **導航到 Profile 時**：

```
✅ [IosSwipeBack] Native swipe-back gesture ENABLED
⚡️  [log] - ✅ [useSwipeBack] Swipe back ENABLED
```

### **測試手勢**：

1. Dashboard → 點擊 Profile
2. 從螢幕最左邊緣向右滑動
3. ✅ 應該能流暢返回 Dashboard

---

## 完整的 JSON 結構參考

如果需要，這是完整的 `capacitor.config.json` 應該有的內容：

```json
{
    "appId": "com.trainpro.app",
    "appName": "MyTrainPro",
    "server": {
        "url": "https://mytrainpro.com",
        "cleartext": false,
        "allowNavigation": [
            "https://mytrainpro.com",
            "https://accounts.google.com",
            "https://appleid.apple.com",
            "https://*.google.com",
            "https://*.apple.com"
        ]
    },
    "ios": {
        "contentInset": "never",
        "backgroundColor": "#000000",
        "allowsLinkPreview": true,
        "limitsNavigationsToAppBoundDomains": false,
        "preferredContentMode": "mobile",
        "scrollEnabled": true,
        "appendUserAgent": "MyTrainPro-iOS/1.0.0"
    },
    "plugins": {
        "App": {
            "launchAutoHide": true
        },
        "Keyboard": {
            "resize": "ionic",
            "style": "dark"
        },
        "StatusBar": {
            "style": "dark",
            "backgroundColor": "#000000"
        },
        "Haptics": {
            "enabled": true
        },
        "CapacitorCookies": {
            "enabled": true
        }
    },
    "packageClassList": [
        "AppPlugin",
        "CAPBrowserPlugin",
        "CAPCameraPlugin",
        "HapticsPlugin",
        "KeyboardPlugin",
        "StatusBarPlugin",
        "IosSwipeBack"
    ]
}
```

---

## 💡 為什麼需要手動編輯？

`npx cap sync ios` 應該從 `capacitor.config.ts` 同步配置，但有時：
- TypeScript 配置沒有被正確讀取
- Capacitor CLI 版本問題
- 自定義插件需要手動註冊

手動編輯 JSON 文件是最直接的解決方案。

---

## 🎯 下一步

完成手動編輯後：

1. ✅ 驗證 JSON 文件有 `"IosSwipeBack"`
2. ✅ 在 Xcode 中 Clean Build
3. ✅ Run 應用
4. ✅ 檢查 Console 日誌
5. ✅ 測試手勢

**成功標準**：看到 `🔌 [IosSwipeBack] Plugin loaded` 日誌！
