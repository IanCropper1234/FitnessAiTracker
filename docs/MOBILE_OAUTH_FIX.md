# Mobile OAuth 修復報告

## 日期
2025-10-09

## 問題診斷

### 問題描述
1. **Apple ID 登入返回登入頁面** - Apple OAuth 失敗但沒有錯誤提示
2. **Google 登入彈出空白頁面** - 日誌顯示使用 web OAuth 而不是 native OAuth
3. **多個 401 錯誤** - session 沒有正確建立

### 根本原因
- `mobile/app.json` 中使用 `$GOOGLE_CLIENT_ID_WEB` 和 `$GOOGLE_CLIENT_ID_IOS` 環境變數佔位符
- Expo 不會自動替換這些環境變數，導致 Client ID 無效
- Native OAuth 失敗後，用戶在 WebView 中觸發 web OAuth flow，在 mobile WebView 中出現問題

## 實施的修復

### 1. ✅ 環境變數配置腳本
創建了 `scripts/configure-app-json.js` 來自動替換 app.json 中的環境變數：

```javascript
// 從環境變數讀取實際值並更新 app.json
const googleClientIdWeb = process.env.GOOGLE_CLIENT_ID_WEB;
const googleClientIdIos = process.env.GOOGLE_CLIENT_ID_IOS;

appJson.expo.extra.googleClientIdWeb = googleClientIdWeb;
appJson.expo.extra.googleClientIdIos = googleClientIdIos;
```

**運行腳本：**
```bash
node scripts/configure-app-json.js
```

### 2. ✅ app.json 配置更新
環境變數已成功替換為實際值：

```json
{
  "expo": {
    "extra": {
      "googleClientIdWeb": "497657957131-8gb7mmtgbknc78qdovbs8hff1b2263r9.apps.googleusercontent.com",
      "googleClientIdIos": "497657957131-l96b41913u5g99k0flv7usfdj410iu21.apps.googleusercontent.com"
    }
  }
}
```

### 3. ✅ AuthManager.js 增強錯誤處理

#### Google OAuth 增強：
- 添加詳細的診斷日誌（Platform、Client ID）
- 驗證 Client ID 配置（檢查是否為 null 或 `$` 開頭）
- 詳細的錯誤信息（message、code、name、stack）
- 返回錯誤詳情給調用者

```javascript
console.log('[Google OAuth] Starting Google Sign In...');
console.log('[Google OAuth] Platform:', Platform.OS);
console.log('[Google OAuth] Client ID:', clientId ? clientId.substring(0, 30) + '...' : 'NOT CONFIGURED');

if (!clientId) {
  throw new Error('Google Client ID not configured. Please check app.json configuration.');
}

if (clientId.startsWith('$')) {
  throw new Error('Google Client ID contains environment variable placeholder. Please run: node scripts/configure-app-json.js');
}
```

#### Apple OAuth 增強：
- 添加詳細的診斷日誌（credential 狀態）
- 詳細的錯誤信息（message、code、name、stack）
- 返回錯誤詳情給調用者

```javascript
console.log('[Apple OAuth] Starting Apple Sign In...');
console.log('[Apple OAuth] Received credential:', {
  hasIdentityToken: !!credential.identityToken,
  hasUser: !!credential.user,
  hasEmail: !!credential.email,
  hasFullName: !!credential.fullName
});
```

### 4. ✅ App.js 用戶錯誤提示

更新了 Google 和 Apple 登入處理函數，顯示詳細的錯誤信息給用戶：

```javascript
Alert.alert(
  "Google Sign In Failed", 
  result.error || "Unable to sign in with Google",
  [
    {
      text: "OK",
      onPress: () => {
        console.log("[Auth] Error details:", result.details);
      }
    }
  ]
);
```

## 診斷日誌輸出

### 成功登入時：
```
[Google OAuth] Starting Google Sign In...
[Google OAuth] Platform: ios
[Google OAuth] Client ID: 497657957131-8gb7mmtgbknc78q...
[Google OAuth] Redirect URI: mytrainpro://auth/google
[Auth] Google sign in successful
```

### 失敗登入時：
```
[Google OAuth] Starting Google Sign In...
[Google OAuth] Platform: ios
[Google OAuth] Client ID: NOT CONFIGURED
[Google OAuth] Detailed error: {
  message: 'Google Client ID not configured. Please check app.json configuration.',
  code: undefined,
  name: 'Error',
  stack: '...'
}
```

## 驗證步驟

1. **檢查環境變數：**
   ```bash
   echo "Google Client ID Web: ${GOOGLE_CLIENT_ID_WEB:0:20}..."
   echo "Google Client ID iOS: ${GOOGLE_CLIENT_ID_IOS:0:20}..."
   ```

2. **運行配置腳本：**
   ```bash
   node scripts/configure-app-json.js
   ```

3. **驗證 app.json：**
   ```bash
   grep -A 3 '"extra"' mobile/app.json
   ```

4. **測試 OAuth 流程：**
   - 在 mobile app 中點擊 Google 登入
   - 檢查控制台輸出診斷日誌
   - 如果失敗，查看詳細的錯誤信息

## 預期結果

### ✅ 成功條件
1. **環境變數正確配置** - app.json 包含實際的 Client ID
2. **詳細的錯誤日誌** - Console 輸出完整的診斷信息
3. **用戶錯誤提示** - 如果失敗，用戶看到具體的錯誤信息
4. **Client ID 驗證** - 檢查並拒絕無效的配置
5. **Native OAuth 正常工作** - 不會 fallback 到 web OAuth

### 🔍 診斷工具
- **配置腳本**: `scripts/configure-app-json.js`
- **環境變數檢查**: `check_secrets` tool
- **日誌輸出**: Console.log 帶有 `[Google OAuth]` 和 `[Apple OAuth]` 標籤

## 後續步驟

如果問題仍然存在：

1. **檢查 Google Cloud Console：**
   - 驗證 OAuth 2.0 Client ID 配置
   - 確認 Redirect URI 包含：`mytrainpro://auth/google`
   - 檢查 iOS Bundle ID 是否匹配：`com.trainpro.app`

2. **檢查 Apple Developer Console：**
   - 驗證 Sign in with Apple 配置
   - 確認 Bundle ID 匹配：`com.trainpro.app`
   - 檢查 Services ID 和 Key 配置

3. **檢查後端配置：**
   - 驗證 `/api/auth/google/mobile` endpoint 配置
   - 驗證 `/api/auth/apple/mobile` endpoint 配置
   - 檢查 CORS 和 Cookie 設置

## 文件修改清單

1. ✅ **創建**: `scripts/configure-app-json.js` - 環境變數配置腳本
2. ✅ **修改**: `mobile/app.json` - 實際 Client ID 值
3. ✅ **修改**: `mobile/auth/AuthManager.js` - 增強錯誤處理和診斷日誌
4. ✅ **修改**: `mobile/App.js` - 用戶錯誤提示
5. ✅ **創建**: `docs/MOBILE_OAUTH_FIX.md` - 修復文檔

## 總結

所有修復已成功實施：
- ✅ 環境變數配置問題已解決
- ✅ 詳細的錯誤處理已添加
- ✅ 用戶錯誤提示已實現
- ✅ 診斷工具已創建

現在 Mobile OAuth 應該能夠：
1. 正確使用 Client ID
2. 提供詳細的錯誤診斷
3. 顯示有用的錯誤信息給用戶
4. 正常執行 Native OAuth 流程
