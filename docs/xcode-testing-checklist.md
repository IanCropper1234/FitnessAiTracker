# FlexSync iOS 測試和部署檢查清單

## 當前狀態檢查

### 1. Xcode 建構狀態
- [ ] 查看 Xcode 左上角狀態顯示 "Build Succeeded"
- [ ] 模擬器已啟動並顯示 iOS 主畫面
- [ ] FlexSync 應用程式圖示出現在模擬器中

### 2. 如果應用程式已啟動
**基本功能測試**：
- [ ] 應用程式可以開啟
- [ ] 登入頁面正常顯示
- [ ] 可以註冊新帳號或使用測試帳號登入
- [ ] 深色/淺色模式切換功能正常
- [ ] 主要頁面（營養、訓練）可以導航

### 3. 進階功能測試
- [ ] 營養追蹤功能運作
- [ ] 訓練記錄可以查看
- [ ] 圖表數據正常顯示
- [ ] AI 功能可以使用（需要 API 金鑰）

## 疑難排解步驟

### 如果應用程式未啟動
1. **檢查建構錯誤**：
   - 查看 Xcode 底部的問題導航器
   - 確認所有錯誤已解決

2. **重設開發環境**：
   ```bash
   # 清理建構快取
   rm -rf ~/Library/Developer/Xcode/DerivedData
   
   # 重新建構
   cd "/Users/ianlau/Desktop/fitness_app/FitnessAiTracker-main"
   npm run build
   npx cap sync ios
   ```

3. **選擇不同的測試目標**：
   - 嘗試不同的模擬器版本
   - 或使用連接的實體 iPhone 設備

### 如果需要 API 金鑰
某些功能（如 AI 營養分析）需要 OpenAI API 金鑰。在測試階段可以：
- 跳過 AI 相關功能
- 或向用戶要求提供測試用的 API 金鑰

## App Store 準備步驟

### 當基本測試通過後：

1. **配置 App Store 帳號**：
   - 確認 Apple Developer Program 會員資格
   - 在 App Store Connect 建立應用程式記錄

2. **準備應用程式資源**：
   - App 圖示 (1024x1024)
   - 各種設備尺寸的截圖
   - 應用程式描述和關鍵字

3. **建構 Archive 版本**：
   - Product → Archive
   - 上傳到 App Store Connect

4. **提交審核**：
   - 填寫所有必要的應用程式資訊
   - 提交 Apple 審核

## 成功指標

- ✅ 應用程式在模擬器中正常運行
- ✅ 主要功能測試通過
- ✅ 無致命錯誤或崩潰
- ✅ 準備好進行 App Store 提交

## 下一步行動

根據當前應用程式狀態：

**如果應用程式運行正常**：
→ 開始準備 App Store 資源和提交流程

**如果仍有問題**：
→ 提供具體錯誤訊息以獲得進一步協助

**如果需要 API 功能**：
→ 提供 OpenAI API 金鑰進行完整測試