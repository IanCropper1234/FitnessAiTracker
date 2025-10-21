# 🔧 Xcode Build Phases 診斷與修復指南

## 問題診斷
插件代碼正確、配置正確，但 `load()` 方法從未被調用，說明：**Swift 文件沒有被編譯到 App 中**。

---

## ✅ 完整檢查清單

### **步驟 1：驗證 Target Membership**

1. **在 Xcode Project Navigator** 中點擊 `WebViewConfig` 文件（單擊選中）
2. **打開 File Inspector**（右側面板）
   - 如果沒有顯示，按 `⌥⌘1` (Option + Command + 1)
3. 找到 **"Target Membership"** 區域
4. **✅ 確保 "App" 已勾選**
   - 如果沒有勾選，點擊勾選框
   - 保存（Command + S）

**截圖位置**：請截圖顯示 Target Membership 狀態

---

### **步驟 2：驗證 Build Phases → Compile Sources**

1. **在 Project Navigator** 中點擊最頂部的 **"App"** 項目（藍色圖標）
2. **選擇 TARGETS → App**（不是 PROJECT）
3. **點擊 "Build Phases" 標籤頁**
4. **展開 "Compile Sources"**（點擊箭頭展開）
5. **查找 `WebViewConfig.swift`**
   - ✅ **必須在列表中**
   - 如果看不到，繼續下一步

**如果 `WebViewConfig.swift` 不在列表中**：

1. 點擊 **"Compile Sources"** 下方的 **"+"** 按鈕
2. 在彈出窗口中找到並選擇 **`WebViewConfig.swift`**
3. 點擊 **"Add"**

**截圖位置**：請截圖顯示 Compile Sources 列表

---

### **步驟 3：如果文件仍然不在項目中**

可能需要重新添加文件到項目：

#### **3.1 移除舊引用（如果存在）**

1. 在 Project Navigator 中右鍵點擊 `WebViewConfig`
2. 選擇 **"Delete"**
3. 在彈出對話框中選擇 **"Remove Reference"**（不要選擇 "Move to Trash"）

#### **3.2 重新添加文件**

1. **右鍵點擊** "App" 文件夾（在 Project Navigator 中）
2. 選擇 **"Add Files to 'App'..."**
3. 導航到：`ios/App/App/WebViewConfig.swift`
4. **確保以下選項已勾選**：
   - ✅ **"Copy items if needed"**（可選，但建議勾選）
   - ✅ **"Create groups"**（不是 "Create folder references"）
   - ✅ **"Add to targets: App"**（重要！）
5. 點擊 **"Add"**

---

### **步驟 4：Clean Build Folder**

1. 在 Xcode 菜單：**Product → Clean Build Folder**
2. 或按 **`⇧⌘K`** (Shift + Command + K)
3. 等待完成

---

### **步驟 5：重新構建**

1. **Product → Build**
2. 或按 **`⌘B`** (Command + B)
3. **檢查構建輸出**，確認沒有編譯錯誤

---

### **步驟 6：Run**

1. **Product → Run**
2. 或按 **`⌘R`** (Command + R)

---

## 🔍 **成功的標誌**

應用啟動時，Console 應該立即顯示：

```
⚡️  WebView loaded
🔌 [IosSwipeBack] Plugin loaded and registered successfully!
```

如果看到這行，問題解決！✅

---

## 📸 **如果仍然不工作，請提供以下截圖**

1. **Target Membership**：
   - 選中 `WebViewConfig` 文件
   - 右側 File Inspector 面板的 "Target Membership" 區域

2. **Build Phases → Compile Sources**：
   - 展開 "Compile Sources" 後的完整列表
   - 確認是否有 `WebViewConfig.swift`

3. **Build 輸出**：
   - 執行 Build 後的完整輸出（特別是任何錯誤或警告）

---

## 🎯 **最可能的原因**

根據經驗，99% 的情況是：
- **Target Membership 沒有勾選 "App"**
- **文件沒有在 Build Phases → Compile Sources 中**

這兩個問題都會導致 Swift 文件不被編譯，從而插件無法加載。

---

## 💡 **替代驗證方法**

如果上述步驟都完成但仍不工作，可以嘗試：

### **檢查編譯後的二進制文件**

在終端執行：

```bash
cd ~/Desktop/FitnessAiTracker/ios/App
# 檢查是否編譯了 WebViewConfig
find DerivedData -name "WebViewConfig*" 2>/dev/null
```

如果沒有輸出，說明文件確實沒有被編譯。

### **檢查 Build Settings**

1. 選擇 TARGETS → App
2. Build Settings 標籤
3. 搜索 "Swift Compiler"
4. 確認 Swift Language Version 設置正確

---

## 🚨 **緊急調試方法**

如果所有方法都失敗，嘗試添加一個簡單的測試插件：

1. 創建 `TestPlugin.swift`：

```swift
import Foundation
import Capacitor

@objc(TestPlugin)
public class TestPlugin: CAPPlugin {
    override public func load() {
        print("🧪 [TestPlugin] Loaded successfully!")
    }
}
```

2. 添加到項目（確保 Target Membership）
3. 在 `capacitor.config.json` 的 `packageClassList` 中添加 `"TestPlugin"`
4. Build + Run

如果 TestPlugin 成功加載，說明問題在 IosSwipeBack 的特定配置上。
如果 TestPlugin 也失敗，說明 Capacitor 插件註冊系統有問題。

---

## 📝 **檢查清單總結**

- [ ] WebViewConfig.swift 在 Project Navigator 中可見
- [ ] Target Membership → "App" 已勾選
- [ ] Build Phases → Compile Sources 包含 WebViewConfig.swift
- [ ] capacitor.config.json 的 packageClassList 包含 "IosSwipeBack"
- [ ] Clean Build Folder 已執行
- [ ] Build 成功（無錯誤）
- [ ] Run 後看到 `🔌 [IosSwipeBack] Plugin loaded` 日誌

---

請按照上述步驟檢查 **Target Membership** 和 **Build Phases → Compile Sources**，並提供截圖。這兩個是最常見的問題！
