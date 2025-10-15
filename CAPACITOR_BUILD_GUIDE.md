# 🚀 Capacitor iOS Build Guide - MyTrainPro

## ✅ 優勢：為什麼用 Capacitor？

1. **無需原生 OAuth 代碼** - 直接加載 mytrainpro.com，Web 端的 OAuth 自動工作
2. **Cookies 自動管理** - Session 自動保存
3. **無建構次數限制** - 在本地 Mac 建構，不受 Expo 限制
4. **完全控制** - 直接用 Xcode，可以調試所有問題

---

## 📋 前提條件

### 必須：
- ✅ **macOS** 電腦
- ✅ **Xcode 15+**（從 App Store 安裝）
- ✅ **Apple Developer Account** ($99/年)
- ✅ **Node.js** 已安裝

### 確認安裝：
```bash
# 檢查 Xcode
xcode-select --version

# 檢查 Node
node --version
```

---

## 🛠️ Step 1: 在 Replit 準備代碼

### 1.1 同步 Capacitor 配置
```bash
cd /path/to/your/project
npx cap sync ios
```

這會：
- 複製 Web 資源到 iOS 項目
- 更新原生配置
- 安裝插件

### 1.2 下載項目到本地 Mac

**方法 A：使用 Git**
```bash
git clone https://github.com/your-username/trainpro.git
cd trainpro
npm install
npx cap sync ios
```

**方法 B：直接下載**
1. 在 Replit 點擊 "Download as zip"
2. 解壓到 Mac
3. 開啟 Terminal，執行：
   ```bash
   cd /path/to/trainpro
   npm install
   npx cap sync ios
   ```

---

## 📱 Step 2: 在 Xcode 開啟項目

```bash
npx cap open ios
```

這會自動開啟 Xcode，顯示 `App.xcworkspace`。

**⚠️ 重要：** 永遠打開 `.xcworkspace`，不是 `.xcodeproj`！

---

## ⚙️ Step 3: Xcode 配置

### 3.1 設定 Bundle Identifier

1. 在 Xcode 左側選擇 **App** project
2. 選擇 **App** target
3. 在 **General** 標籤：
   - **Bundle Identifier**: `com.trainpro.app`
   - **Version**: `1.0.0`
   - **Build**: `1`（每次上傳 TestFlight 需要遞增）

### 3.2 設定 Signing

1. 在 **Signing & Capabilities** 標籤
2. ✅ 勾選 **Automatically manage signing**
3. **Team**: 選擇您的 Apple Developer Team
4. Xcode 會自動創建 Provisioning Profile

### 3.3 確認 Info.plist 設定

已自動配置：
- ✅ Display Name: MyTrainPro
- ✅ URL Scheme: mytrainpro
- ✅ Camera 和 Photo Library 權限
- ✅ mytrainpro.com 網路安全設定

---

## 🏗️ Step 4: 建構應用

### 4.1 選擇目標設備

在 Xcode 頂部：
- 點擊設備選單
- 選擇 **"Any iOS Device (arm64)"**

### 4.2 建構 Archive

1. 菜單：**Product** → **Archive**
2. 等待建構完成（首次可能需要 5-10 分鐘）
3. 成功後會自動打開 **Organizer** 視窗

---

## 🚀 Step 5: 上傳到 TestFlight

### 5.1 在 Organizer 中

1. 選擇剛建構的 Archive
2. 點擊 **"Distribute App"**
3. 選擇 **"App Store Connect"**
4. 點擊 **"Upload"**
5. 保持所有默認選項
6. 點擊 **"Next"** → **"Upload"**

### 5.2 在 App Store Connect

1. 前往 [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. 選擇 **"My Apps"**
3. 找到 **MyTrainPro**（如果是新應用，需要先創建）
4. 點擊 **"TestFlight"** 標籤
5. 等待 Build 處理完成（通常 5-15 分鐘）
6. 添加測試者 Email
7. 測試者會收到 TestFlight 邀請

---

## 🔄 更新應用（後續版本）

### 方式 A：快速更新（只改 Web 內容）

如果只修改了 Web 代碼（mytrainpro.com 的內容），**不需要重新建構**！
用戶直接刷新 app 就能看到最新版本。

### 方式 B：完整更新（原生變更）

如果修改了：
- Info.plist
- Capacitor 配置
- 添加新插件

則需要：
1. 在 Replit 執行 `npx cap sync ios`
2. 下載最新代碼到 Mac
3. 在 Xcode 中：
   - **遞增 Build Number**（例如從 1 → 2）
   - 重新 Archive
   - 上傳到 TestFlight

---

## ❓ 常見問題

### Q: 為什麼不需要原生 OAuth 代碼？

**A:** 因為 Capacitor 直接加載 mytrainpro.com！
- 用戶在 WebView 中完成 Google/Apple 登入
- Cookies 自動保存
- 就像在 Safari 中登入一樣簡單

### Q: OAuth redirect URI 需要設定嗎？

**A:** 使用現有的 Web OAuth 設定即可：
- Google: `https://mytrainpro.com/api/auth/google/callback`
- Apple: `https://mytrainpro.com/api/auth/apple/callback`

**不需要** 添加 `mytrainpro://` scheme 的 redirect！

### Q: 如何測試本地開發版本？

修改 `capacitor.config.ts`：
```typescript
server: {
  // 本地測試時取消註解：
  url: 'http://localhost:5000',
  cleartext: true
}
```

然後：
1. 在 Replit 啟動開發服務器
2. 在 Xcode 運行到真機或模擬器
3. App 會加載本地服務器

**上線前記得改回：**
```typescript
server: {
  url: 'https://mytrainpro.com',
  cleartext: false
}
```

### Q: 建構失敗怎麼辦？

**常見錯誤：**

1. **"No signing certificate found"**
   - 解決：在 Xcode Preferences → Accounts 登入 Apple ID
   - 下載 Certificates

2. **"Bundle Identifier already exists"**
   - 解決：在 App Store Connect 創建新應用
   - 或使用不同的 Bundle ID

3. **"Command PhaseScriptExecution failed"**
   - 解決：清理並重建
   ```bash
   cd ios/App
   rm -rf DerivedData
   cd ../..
   npx cap sync ios
   ```

---

## 📊 成本對比

| 項目 | Expo | Capacitor |
|------|------|-----------|
| **框架** | 免費 | 免費 |
| **建構** | 15 次/月（免費版） | ♾️ 無限（本地建構） |
| **Apple Developer** | $99/年 | $99/年 |
| **總成本** | $99/年 + 超過 15 次需付費 | $99/年 |

---

## 🎯 下一步

1. **立即測試：** 按照 Step 1-5 建構第一個版本
2. **添加測試者：** 在 TestFlight 中添加您的 Email
3. **安裝測試：** 在 iPhone 上安裝 TestFlight app，接受邀請
4. **測試 OAuth：** 確認 Google 和 Apple 登入正常工作
5. **準備上架：** 在 App Store Connect 填寫應用資訊

---

## 📞 需要幫助？

- **Capacitor 文檔：** https://capacitorjs.com/docs
- **Apple 開發者文檔：** https://developer.apple.com
- **TestFlight 指南：** https://developer.apple.com/testflight

---

**🎉 恭喜！您現在可以無限次建構 iOS 應用，不再受 Expo 限制！**
