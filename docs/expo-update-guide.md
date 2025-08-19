# TrainPro Expo 應用程式更新指南

## 🔄 更新方式概覽

TrainPro 的 WebView + Expo 架構提供了三種更新方式，讓您能靈活地推送不同類型的更新：

### **1. 🚀 PWA 層級更新 (推薦 - 最簡單)**
**適用情況**: 99% 的日常更新
- UI 介面變更
- 新功能開發
- Bug 修復
- 內容更新
- 訓練演算法調整

**更新方式**:
```bash
# 在 Replit 中直接部署
# TrainPro PWA 會立即更新，用戶下次開啟 App 即可看到變更
```

**優勢**:
- ✅ 立即生效 (用戶下次開啟 App)
- ✅ 無需 App Store 審核
- ✅ 無需重新建構 Expo App
- ✅ 完全免費

### **2. ⚡ Expo OTA Updates**
**適用情況**: Expo/React Native 層級變更
- App.js 修改
- 原生配置調整
- 套件版本更新 (非破壞性)

**更新方式**:
```bash
cd mobile

# 推送到生產環境
npm run update:production

# 或推送到預覽環境測試
npm run update:preview
```

**特點**:
- ⚡ 數分鐘內推送到用戶設備
- 🔄 自動檢查更新 (App 啟動時)
- 🆓 免費且無需 App Store 審核

### **3. 📦 App Store 重新提交**
**適用情況**: 重大變更
- 版本號更新 (1.0.0 → 1.1.0)
- App 名稱或圖示變更
- 新增原生權限
- Expo SDK 大版本升級

**更新方式**:
```bash
cd mobile

# 1. 更新版本號 (在 app.json)
# 2. 重新建構
npm run build:ios

# 3. 重新提交
npm run submit:ios
```

## 📋 具體更新步驟

### **A. PWA 層級更新 (最常用)**

**步驟 1**: 在 Replit 修改 TrainPro 代碼
```bash
# 例如：修改 client/src/pages/dashboard.tsx
# 或新增功能到任何前端文件
```

**步驟 2**: 測試變更
```bash
# 在 Replit 預覽中測試功能
```

**步驟 3**: 部署
```bash
# 使用 Replit Deploy 功能
# 或推送到 Git 觸發自動部署
```

**結果**: 用戶下次開啟 iOS App 時自動看到更新

---

### **B. Expo OTA 更新**

**步驟 1**: 修改 mobile/ 目錄內容
```bash
cd mobile
# 例如：修改 App.js 或 app.json 配置
```

**步驟 2**: 推送更新
```bash
# 推送到生產環境
eas update --branch production --message "修復啟動畫面問題"

# 或使用便捷指令
npm run update:production
```

**步驟 3**: 監控部署
```bash
# 檢查更新狀態
eas update:list --branch production
```

**結果**: 用戶設備在 App 重新啟動時自動下載更新

---

### **C. App Store 重新提交**

**步驟 1**: 更新版本資訊
```json
// mobile/app.json
{
  "expo": {
    "version": "1.1.0",  // 更新版本號
    "ios": {
      "buildNumber": "1.1.0"  // 更新建構號
    }
  }
}
```

**步驟 2**: 重新建構和提交
```bash
cd mobile

# 建構新版本
eas build --platform ios --profile production

# 提交到 App Store
eas submit --platform ios --profile production
```

**步驟 3**: App Store Connect 處理
- 等待建構完成 (15-30 分鐘)
- 在 App Store Connect 中設置發布資訊
- 提交審核 (1-7 天)

## 🎯 更新策略建議

### **日常開發週期**
```
週一-週五: PWA 層級更新
↓
每月: Expo OTA 更新 (如有必要)
↓
每季: App Store 重新提交 (重大版本)
```

### **緊急修復**
```
Critical Bug → PWA 更新 (立即修復)
App 無法啟動 → Expo OTA 更新 (數分鐘)
原生功能問題 → App Store 緊急提交
```

## 📊 更新影響範圍

| 更新類型 | 生效時間 | 審核需求 | 用戶體驗 |
|----------|----------|----------|----------|
| **PWA 更新** | 立即 | 無 | 無感更新 |
| **Expo OTA** | 2-5 分鐘 | 無 | App 重啟後生效 |
| **App Store** | 1-7 天 | 需要 | 手動更新 |

## 🔧 監控和回滾

### **檢查更新狀態**
```bash
# 查看 OTA 更新歷史
eas update:list --branch production

# 查看特定更新詳情
eas update:view [update-id]
```

### **回滾機制**
```bash
# PWA 回滾：Git revert + 重新部署
git revert [commit-hash]

# Expo OTA 回滾：推送前一個版本
eas update --branch production --input-dir [previous-build]

# App Store 回滾：在 App Store Connect 中切換版本
```

## ⚠️ 重要注意事項

### **PWA 更新限制**
- ✅ 所有 UI/UX 變更
- ✅ 功能邏輯修改
- ❌ 無法更改 WebView 配置
- ❌ 無法新增原生權限

### **Expo OTA 限制**
- ✅ JavaScript 代碼變更
- ✅ 配置檔案修改
- ❌ 無法更新原生依賴
- ❌ 無法修改 App Store 元資料

### **最佳實踐**
1. **測試**: 所有更新都應在開發環境充分測試
2. **漸進式**: 先推送到小部分用戶測試
3. **監控**: 觀察更新後的 App 崩潰率和用戶反饋
4. **備份**: 保留每個版本的快照以便回滾

## 🎉 TrainPro 的更新優勢

由於採用 WebView + Expo 架構，TrainPro 具有獨特優勢：

- **95% 的更新** 可以透過 PWA 立即推送
- **5% 的更新** 需要 Expo OTA 或 App Store
- **用戶體驗** 幾乎無感知的持續改進
- **開發效率** 大幅提升更新頻率和響應速度

這種架構讓 TrainPro 能夠快速響應用戶需求，持續改進產品體驗，同時保持 App Store 合規性。