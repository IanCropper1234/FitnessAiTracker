# iOS App OAuth 問題診斷與修復方案

## 發現的問題

### 1. **Google OAuth 空白頁面問題**

**根本原因：Session Cookie 無法在 Mobile WebView 中生效**

#### 問題分析：
1. Mobile app 完成 OAuth 流程後，backend 創建 session 並返回 `trainpro.session` cookie
2. Backend session cookie 配置為 `httpOnly: true`（server/replitAuth.ts:43）
3. Mobile app 嘗試通過 JavaScript 注入 cookie：
   ```javascript
   // mobile/App.js:237-242
   if (sessionData.cookies) {
     const cookies = sessionData.cookies.split(';');
     cookies.forEach(cookie => {
       document.cookie = cookie.trim();  // ❌ 無法設置 httpOnly cookies
     });
   }
   ```
4. **JavaScript 無法設置 httpOnly cookies**，導致 session 實際上沒有生效
5. WebView 載入時沒有有效 session，可能顯示空白頁面或重定向到登錄頁

#### 證據：
- Session cookie 配置：`httpOnly: true, secure: true (production), sameSite: 'lax'`
- Mobile token exchange 端點成功創建 session，但 WebView 無法使用該 session
- Set-Cookie header 中的 httpOnly cookie 無法通過 `document.cookie` 設置

---

### 2. **Apple Auth 重新加載問題**

**根本原因：同樣的 Session Cookie 注入失敗 + 自動重新加載機制**

#### 問題分析：
1. 與 Google OAuth 相同的 cookie 注入問題
2. WebView 檢測到空白頁面，觸發自動重新加載機制（mobile/App.js:261-343）
3. 重新加載後仍然沒有有效 session，形成循環

#### 自動重新加載觸發條件：
- 從背景返回時檢測到空白頁面
- Page show 事件時檢測到空白頁面
- 不活動超過設定時間

---

## 修復方案

### 方案 1：為 Mobile 端點返回特殊的非 HttpOnly Cookie（推薦）

#### 實施步驟：

1. **在 mobile token exchange 端點添加額外的 mobile-specific cookie**：
   ```typescript
   // 除了正常的 httpOnly session cookie 外，額外設置一個可供 JS 訪問的 cookie
   res.cookie('trainpro.mobile.session', req.sessionID, {
     httpOnly: false,  // 允許 JavaScript 訪問
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 7 * 24 * 60 * 60 * 1000,
     path: '/'
   });
   ```

2. **更新 mobile session injection 邏輯**：
   - 從 response 中讀取 Set-Cookie headers
   - 正確解析並注入可訪問的 cookies

3. **Backend 驗證邏輯**：
   - 檢查 httpOnly session cookie（優先）
   - 如果不存在，檢查 mobile-specific cookie
   - 確保兩者的 session ID 一致

#### 優點：
- ✅ 保持主 session cookie 的安全性（httpOnly）
- ✅ 允許 mobile app 訪問 session
- ✅ 最小化代碼更改

#### 缺點：
- ⚠️ 增加了一個可被 JavaScript 訪問的 session cookie（安全性略降）

---

### 方案 2：返回完整的 Set-Cookie Header 給 Mobile App

#### 實施步驟：

1. **在 mobile token exchange 響應中包含 Set-Cookie header**：
   ```typescript
   res.json({ 
     success: true, 
     user,
     sessionId: req.sessionID,  // 明確返回 session ID
     cookieName: 'trainpro.session'
   });
   ```

2. **Mobile app 使用 WKWebView 的原生 cookie 管理**：
   - 使用 `WKHTTPCookieStore` API 設置 httpOnly cookies
   - 不依賴 JavaScript 注入

#### 優點：
- ✅ 保持完整的 cookie 安全性
- ✅ 使用原生 API，更可靠

#### 缺點：
- ⚠️ 需要更多的原生代碼更改
- ⚠️ Expo 可能不支援所有原生 API

---

### 方案 3：使用 JWT Token 替代 Session Cookie（長期方案）

#### 實施步驟：

1. **Mobile OAuth 端點返回 JWT token**：
   ```typescript
   const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
   res.json({ success: true, user, token });
   ```

2. **Mobile app 將 token 存儲在 SecureStore**

3. **WebView 每次請求時附加 Authorization header**

#### 優點：
- ✅ 完全避開 cookie 問題
- ✅ 更適合 mobile app
- ✅ 更靈活的認證機制

#### 缺點：
- ⚠️ 需要重構認證邏輯
- ⚠️ 需要實施 token refresh 機制

---

## 推薦實施方案

**立即修復：方案 1（添加 mobile-specific cookie）**
- 快速修復當前問題
- 最小化代碼更改
- 保持大部分安全性

**長期優化：方案 3（JWT token）**
- 更適合 mobile app 架構
- 更好的安全性和靈活性
- 與 web session 分離

---

## 已完成的改進

✅ 更新 OAuth 工具函數優先使用 mytrainpro.com
✅ 更新 Mobile AuthManager BACKEND_URL 為 mytrainpro.com  
✅ 添加詳細的錯誤處理和日誌到 mobile token exchange 端點
✅ 診斷並識別 iOS OAuth 問題的根本原因

---

## 需要用戶確認的配置

請確認以下 OAuth 配置已在 Google/Apple 控制台中設置：

### Google OAuth：
- ✅ Authorized redirect URIs: `https://mytrainpro.com/api/auth/google/callback`
- ✅ Authorized JavaScript origins: `https://mytrainpro.com`

### Apple Sign In：
- ✅ Return URLs: `https://mytrainpro.com/api/auth/apple/callback`
- ✅ Services ID configured with mytrainpro.com domain

---

## 下一步行動

1. 實施方案 1：添加 mobile-specific cookie
2. 測試 Google OAuth 流程
3. 測試 Apple Sign In 流程
4. 監控日誌以確認修復有效
5. 計劃長期遷移到 JWT token 方案
