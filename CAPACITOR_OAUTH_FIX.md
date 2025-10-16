# 🔐 修復 iOS App OAuth 在外部瀏覽器打開的問題

## 問題描述

當在 iOS app 中點擊 Google 或 Apple OAuth 登入時，會跳轉到外部 Safari 瀏覽器，完成登入後無法自動返回 app。

## 根本原因

**Capacitor WebView 的預設行為：** 將 OAuth 重定向（外部 URL）打開到系統瀏覽器，而不是在 app 內的 WebView 中完成。

---

## 🎯 解決方案概覽

有兩種解決方案：

| 方案 | 難度 | 工作方式 | 推薦度 |
|------|------|----------|--------|
| **A: 檢測環境 + Deep Link** | 中等 | 檢測 app 環境，使用自定義 URL scheme callback | ⭐⭐⭐⭐⭐ |
| **B: Universal Links** | 困難 | 使用 Associated Domains 配置 | ⭐⭐⭐ |

**推薦方案 A**：更簡單、更可靠

---

## ✅ 解決方案 A：環境檢測 + Deep Link（推薦）

### 工作流程

```
1. 用戶在 app 中點擊「Sign in with Google」
   ↓
2. 前端檢測到在 app 環境（通過 User-Agent）
   ↓
3. 使用特殊參數告訴後端「這是 app 環境」
   ↓
4. 後端完成 OAuth 後，重定向到 mytrainpro://auth/callback?session=xxx
   ↓
5. iOS 攔截 mytrainpro:// scheme，打開 app
   ↓
6. app 提取 session token，載入主頁
   ↓
7. ✅ 用戶已登入！
```

---

### Step 1: 前端檢測 App 環境

**修改：** `client/src/pages/Login.tsx`（或您的登入頁面）

```typescript
// 檢測是否在 Capacitor app 中
function isCapacitorApp(): boolean {
  const userAgent = navigator.userAgent || '';
  return userAgent.includes('MyTrainPro-iOS') || 
         userAgent.includes('Capacitor');
}

// 修改 OAuth 登入 URL
function getOAuthUrl(provider: 'google' | 'apple'): string {
  const baseUrl = `/api/auth/${provider}`;
  
  // 如果在 app 中，添加 redirect_mode 參數
  if (isCapacitorApp()) {
    return `${baseUrl}?redirect_mode=app`;
  }
  
  return baseUrl;
}

// 在登入按鈕中使用
<a href={getOAuthUrl('google')} data-testid="link-google-oauth">
  <Button>Sign in with Google</Button>
</a>

<a href={getOAuthUrl('apple')} data-testid="link-apple-oauth">
  <Button>Sign in with Apple</Button>
</a>
```

---

### Step 2: 後端處理 App 環境的 Callback

**修改：** `server/routes.ts`

```typescript
// Google OAuth callback 處理
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { 
    failureRedirect: "/login",
    session: false 
  }),
  async (req: Request, res: Response) => {
    const user = req.user as { userId: number; provider: string };
    
    // 創建 session
    req.session.userId = user.userId;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    // 檢查是否來自 app（通過 state 或 referer）
    const isFromApp = req.query.state?.toString().includes('app') || 
                      req.headers['user-agent']?.includes('MyTrainPro-iOS');

    if (isFromApp) {
      // App 環境：重定向到自定義 URL scheme
      const sessionId = req.sessionID;
      return res.redirect(`mytrainpro://auth/callback?session=${sessionId}&userId=${user.userId}`);
    }

    // Web 環境：正常重定向
    res.redirect("/dashboard");
  }
);

// Apple OAuth callback 類似處理
app.post(
  "/api/auth/apple/callback",
  passport.authenticate("apple", { 
    failureRedirect: "/login",
    session: false 
  }),
  async (req: Request, res: Response) => {
    const user = req.user as { userId: number; provider: string };
    
    req.session.userId = user.userId;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    const isFromApp = req.body.state?.includes('app') || 
                      req.headers['user-agent']?.includes('MyTrainPro-iOS');

    if (isFromApp) {
      const sessionId = req.sessionID;
      return res.redirect(`mytrainpro://auth/callback?session=${sessionId}&userId=${user.userId}`);
    }

    res.redirect("/dashboard");
  }
);
```

---

### Step 3: iOS 處理 Deep Link

**已配置：** `ios/App/App/Info.plist` 已有 `mytrainpro://` URL scheme

**修改：** `ios/App/App/AppDelegate.swift`

```swift
import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // ... 其他方法 ...

    func application(_ app: UIApplication, open url: URL, 
                    options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        
        // 處理 mytrainpro:// deep link
        if url.scheme == "mytrainpro" {
            print("📱 [Deep Link] Received: \(url.absoluteString)")
            
            // 解析 URL 參數
            if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
               let queryItems = components.queryItems {
                
                var sessionId: String?
                var userId: String?
                
                for item in queryItems {
                    if item.name == "session" {
                        sessionId = item.value
                    }
                    if item.name == "userId" {
                        userId = item.value
                    }
                }
                
                if let sessionId = sessionId, let userId = userId {
                    print("✅ [Deep Link] Session ID: \(sessionId), User ID: \(userId)")
                    
                    // 通知 WebView 處理 session
                    NotificationCenter.default.post(
                        name: NSNotification.Name("oauthCallback"),
                        object: nil,
                        userInfo: ["sessionId": sessionId, "userId": userId]
                    )
                    
                    return true
                }
            }
        }
        
        // Fallback to Capacitor default handler
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }
}
```

---

### Step 4: 前端處理 Deep Link Callback

**創建：** `client/src/utils/capacitorAuth.ts`

```typescript
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export function setupOAuthDeepLinkListener() {
  if (!Capacitor.isNativePlatform()) {
    return; // 只在原生 app 中設置
  }

  App.addListener('appUrlOpen', async (data: { url: string }) => {
    console.log('📱 App URL opened:', data.url);
    
    // 解析 mytrainpro://auth/callback?session=xxx&userId=yyy
    const url = new URL(data.url);
    
    if (url.pathname === '/auth/callback') {
      const sessionId = url.searchParams.get('session');
      const userId = url.searchParams.get('userId');
      
      if (sessionId && userId) {
        console.log('✅ OAuth callback received, session:', sessionId);
        
        // 設定 cookie（如果需要）
        // 或者直接重新載入頁面以使用 session
        window.location.href = '/dashboard';
      }
    }
  });
}
```

**在 App.tsx 中初始化：**

```typescript
import { useEffect } from 'react';
import { setupOAuthDeepLinkListener } from '@/utils/capacitorAuth';

function App() {
  useEffect(() => {
    setupOAuthDeepLinkListener();
  }, []);

  // ... 其他代碼
}
```

---

## 🔄 完整流程示例

### Google OAuth 流程

1. **用戶點擊登入**
   ```
   用戶在 app 中點擊「Sign in with Google」
   → 前端檢測到 User-Agent 包含 "MyTrainPro-iOS"
   → 導航到 /api/auth/google?redirect_mode=app
   ```

2. **OAuth 授權**
   ```
   → Google 授權頁面在 WebView 中打開
   → 用戶點擊「允許」
   → Google 重定向到 /api/auth/google/callback?code=xxx&state=app
   ```

3. **後端處理**
   ```
   → 後端驗證 Google code
   → 創建/找到用戶
   → 創建 session
   → 檢測到 state 包含 "app"
   → 重定向到 mytrainpro://auth/callback?session=abc123&userId=456
   ```

4. **App 處理 Deep Link**
   ```
   → iOS 攔截 mytrainpro:// scheme
   → AppDelegate 解析 session ID
   → 通知 WebView
   → WebView 重新載入 /dashboard
   → ✅ 用戶已登入！
   ```

---

## 🛠️ Apple OAuth 特殊處理

Apple OAuth 使用 POST callback，需要額外處理：

```typescript
// 後端：server/routes.ts
app.post("/api/auth/apple/callback", 
  passport.authenticate("apple", { session: false }),
  async (req: Request, res: Response) => {
    // ... 創建 session ...
    
    const isFromApp = req.headers['user-agent']?.includes('MyTrainPro-iOS');
    
    if (isFromApp) {
      // ⚠️ POST callback 無法直接 redirect 到自定義 scheme
      // 解決方案：返回 HTML 自動跳轉
      const sessionId = req.sessionID;
      const redirectUrl = `mytrainpro://auth/callback?session=${sessionId}&userId=${user.userId}`;
      
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta http-equiv="refresh" content="0; url=${redirectUrl}">
          </head>
          <body>
            <script>
              window.location.href = '${redirectUrl}';
            </script>
            <p>Redirecting to app...</p>
          </body>
        </html>
      `);
    }
    
    res.redirect("/dashboard");
  }
);
```

---

## ✅ 測試步驟

### 1. 構建新版本

在 Mac 上：

```bash
# 拉取最新代碼
git pull

# 同步配置
npx cap sync ios

# 在 Xcode 中
# 1. Clean Build (⌘⇧K)
# 2. 遞增 Build Number
# 3. Archive 並上傳 TestFlight
```

### 2. 測試 Google OAuth

1. 在 TestFlight 安裝最新版本
2. 點擊「Sign in with Google」
3. **預期行為：**
   - ✅ Google 授權頁面在 app 內打開（不跳轉到 Safari）
   - ✅ 授權後自動返回 app
   - ✅ 顯示 dashboard（已登入）

### 3. 測試 Apple OAuth

1. 點擊「Sign in with Apple」
2. **預期行為：**
   - ✅ Apple 授權頁面在 app 內打開
   - ✅ 授權後自動返回 app
   - ✅ 顯示 dashboard（已登入）

---

## 🐛 故障排除

### 問題 1: OAuth 仍然打開外部瀏覽器

**檢查：**
```bash
# 確認 User-Agent 正確設置
cat capacitor.config.ts | grep appendUserAgent
# 應該看到: appendUserAgent: 'MyTrainPro-iOS/1.0.0'
```

**解決：**
```bash
npx cap sync ios  # 同步配置
# 在 Xcode 重新建構
```

### 問題 2: Deep Link 無法打開 app

**檢查：**
```bash
# 確認 URL scheme 配置
cat ios/App/App/Info.plist | grep -A5 CFBundleURLSchemes
# 應該看到: <string>mytrainpro</string>
```

### 問題 3: Session 無法恢復

**檢查 Console 日誌：**

在 Mac Safari → 開發 → iPhone → MyTrainPro

```javascript
// 檢查 session cookie
document.cookie
// 應該包含 trainpro.session
```

---

## 📊 方案對比

| 特性 | 當前方案（Deep Link） | 替代方案（Universal Links） |
|------|----------------------|---------------------------|
| **實現難度** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 困難 |
| **可靠性** | ⭐⭐⭐⭐⭐ 非常可靠 | ⭐⭐⭐⭐ 可靠 |
| **配置複雜度** | 前端 + 後端 + iOS | 前端 + 後端 + iOS + 伺服器 |
| **需要額外配置** | 無 | Associated Domains, AASA 文件 |
| **用戶體驗** | 流暢 | 流暢 |

---

## 🎯 下一步

1. **實現前端檢測** - 修改登入頁面添加環境檢測
2. **更新後端路由** - 處理 app 環境的 callback
3. **更新 iOS Deep Link 處理** - 在 AppDelegate.swift 中添加邏輯
4. **添加前端 Deep Link 監聽** - 設置 Capacitor App URL 監聽器
5. **測試完整流程** - Google 和 Apple OAuth

---

**🚀 完成這些步驟後，OAuth 將完全在 app 內完成，用戶體驗將大幅提升！**
