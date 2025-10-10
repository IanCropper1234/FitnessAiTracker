# Apple OAuth 測試配置指南

## 🔍 當前問題

**環境配置：**
- `PRIMARY_DOMAIN=mytrainpro.com` 
- 實際應用運行在：`https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev`

**問題：** Apple 將用戶重定向到 `mytrainpro.com`，但應用程式不在那裡！

---

## ✅ 解決方案 A：測試環境快速配置

### 步驟 1：在 Apple Developer Console 添加測試 URL

1. 訪問 [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. 選擇你的 Service ID
3. 在 **Return URLs** 中添加：
   ```
   https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev/api/auth/apple/callback
   ```
4. 保存配置

### 步驟 2：更新 PRIMARY_DOMAIN（臨時測試）

在 Replit Secrets 中：
- **Key**: `PRIMARY_DOMAIN`
- **Value**: `06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev`

⚠️ **注意**：不要包含 `https://`，只需域名部分！

### 步驟 3：重啟應用並測試

重啟後，你應該在日誌中看到：
```
📱 Apple OAuth callback URL configured: https://06480408-c2d8-4ed1-9930-a2a5ef556988-00-12b1yngnrq34l.worf.replit.dev/api/auth/apple/callback
```

---

## ✅ 解決方案 B：生產環境配置（推薦）

### 前提條件：
- 你已擁有 `mytrainpro.com` 域名
- 你需要配置 DNS 或使用 Replit Deployment

### 步驟 1：發布應用到自定義域名

1. 在 Replit 中點擊 "Deploy" 或 "Publish"
2. 配置自定義域名：`mytrainpro.com`
3. 按照 Replit 的指引配置 DNS（通常是添加 CNAME 記錄）

### 步驟 2：驗證域名

確認你的應用程式可以通過 `https://mytrainpro.com` 訪問

### 步驟 3：Apple Developer Console 配置

確保 Return URLs 包含：
```
https://mytrainpro.com/api/auth/apple/callback
```

### 步驟 4：環境變數

Replit Secrets 中保持：
- **Key**: `PRIMARY_DOMAIN`
- **Value**: `mytrainpro.com`

---

## 🧪 測試 Apple OAuth

完成上述任一方案後：

1. ✅ 點擊 "Sign in with Apple"
2. ✅ 完成 Apple 登入
3. ✅ 應該看到以下日誌：

```
🍎 [Apple OAuth] Initial request received
🍎 [Apple OAuth] Calling passport.authenticate with state: ...
POST /api/auth/apple 302

🍎 [Apple Callback] Request received: { method: 'POST', ... }
📥 Apple OAuth callback data: { hasCode: true, ... }
✅ Apple Sign In session created for user <userId>
```

4. ✅ 成功登入並重定向到 dashboard

---

## ❓ 常見問題

### Q: 為什麼測試域名這麼長？
A: Replit 自動生成的臨時域名。生產環境應使用自定義域名。

### Q: 可以同時配置多個 callback URL 嗎？
A: 可以！在 Apple Developer Console 中可以添加多個 Return URLs：
- `https://mytrainpro.com/api/auth/apple/callback` (生產)
- `https://[replit-domain]/api/auth/apple/callback` (測試)

### Q: PRIMARY_DOMAIN 應該設置哪個值？
A: 
- **測試**：設置為當前 Replit 域名
- **生產**：設置為 `mytrainpro.com`

---

## 📝 當前狀態

- ✅ Apple OAuth strategy 已正確配置
- ✅ 日誌記錄完整
- ✅ Session 創建邏輯正確
- ❌ **需要修復**：域名配置不匹配

選擇上述方案之一即可解決問題！
