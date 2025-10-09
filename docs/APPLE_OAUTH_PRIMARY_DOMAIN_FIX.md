# Apple OAuth Primary Domain Configuration Fix

## 🔍 Root Cause Analysis (95%+ Confidence)

**Problem:** Apple OAuth login triggers successfully but fails to create a session, preventing dashboard access.

**Root Cause:** `PRIMARY_DOMAIN` environment variable is not set, causing callback URL mismatch with Apple Developer Console configuration.

### Technical Explanation

#### Current State (❌ Broken)
```bash
PRIMARY_DOMAIN='not set'  # Environment variable missing
```

**What happens:**
1. ✅ User clicks "Sign in with Apple" → POST to `/api/auth/apple`
2. ✅ Passport redirects to Apple login page
3. ✅ User completes Apple authentication
4. ❌ **Apple attempts callback with URL mismatch:**
   - Apple expects: `https://mytrainpro.com/api/auth/apple/callback` (registered in Apple Developer Console)
   - Passport generates: `https://[dynamic-replit-url]/api/auth/apple/callback` (relative path resolved)
5. ❌ **Apple returns error:** `invalid_request - Invalid web redirect url`
6. ❌ **Our callback handler never executes** → No session created → Login fails

#### Evidence from Logs
```
📱 Apple OAuth callback URL configured: /api/auth/apple/callback  ← Relative path (problematic)
```

No callback execution logs found:
- ❌ No `📥 Apple OAuth callback:` messages
- ❌ No `✅ Apple Sign In session created` messages

---

## ✅ Solution: Set PRIMARY_DOMAIN Environment Variable

### Step 1: Configure Environment Variable

**For Production/Deployment:**
```bash
PRIMARY_DOMAIN=mytrainpro.com
```

**Important Notes:**
- ⚠️ **DO NOT** include protocol (`https://`)
- ⚠️ **DO NOT** include trailing slash
- ✅ Use domain only: `mytrainpro.com`

### Step 2: Verify Configuration

After setting `PRIMARY_DOMAIN`, restart the server and check startup logs:

**Expected Output:**
```
📱 Apple OAuth callback URL configured: https://mytrainpro.com/api/auth/apple/callback
✅ Apple Sign In strategy configured with dynamic callback URL
```

### Step 3: Test Apple OAuth Flow

1. Click "Sign in with Apple" button
2. Complete Apple authentication
3. Check server logs for success indicators:

**Expected Logs:**
```
🍎 [Apple OAuth] Initial request received: { method: 'POST', url: '/api/auth/apple', ... }
🍎 [Apple OAuth] Calling passport.authenticate with state: ...
📥 Apple OAuth callback: { state: '...', hasCode: true, ... }
✅ Apple Sign In session created for user <userId>
```

---

## 🔐 Apple Developer Console Configuration

Ensure your Apple Developer Console has the **exact** callback URL registered:

**Service ID Configuration:**
- **Return URLs:** `https://mytrainpro.com/api/auth/apple/callback`
- **Must match exactly** (protocol, domain, path)

**Verification:**
1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Select your Service ID
3. Verify Return URLs include: `https://mytrainpro.com/api/auth/apple/callback`

---

## 📋 Environment Variables Checklist

All Apple OAuth environment variables required:

- ✅ `APPLE_SERVICES_ID` - Set
- ✅ `APPLE_TEAM_ID` - Set  
- ✅ `APPLE_KEY_ID` - Set
- ✅ `APPLE_PRIVATE_KEY` - Set (properly formatted with newlines)
- ❌ `PRIMARY_DOMAIN` - **MISSING** ← **This is the problem!**

---

## 🧪 Testing Environments

### Production Environment
```bash
PRIMARY_DOMAIN=mytrainpro.com
```
- ✅ Apple OAuth will work
- ✅ Callback URL matches Apple Developer Console
- ✅ Session creation succeeds

### Development/Testing Environments
- ⚠️ Without `PRIMARY_DOMAIN`, callback URL will be dynamic (e.g., `https://xxxx.replit.app/...`)
- ⚠️ Apple will reject unless this URL is also registered in Apple Developer Console
- 💡 **Recommendation:** Add development URLs to Apple Developer Console, or set `PRIMARY_DOMAIN` for testing

---

## 🔄 Fallback Behavior

The code implements smart fallback logic:

```typescript
// server/auth/apple-oauth.ts (lines 75-77)
const callbackURL = process.env.PRIMARY_DOMAIN 
  ? `https://${process.env.PRIMARY_DOMAIN}/api/auth/apple/callback`
  : "/api/auth/apple/callback";  // Relative path (problematic for Apple)
```

**When PRIMARY_DOMAIN is set:**
- ✅ Full URL: `https://mytrainpro.com/api/auth/apple/callback`
- ✅ Matches Apple Developer Console
- ✅ OAuth succeeds

**When PRIMARY_DOMAIN is not set:**
- ❌ Relative path: `/api/auth/apple/callback`
- ❌ Resolved to dynamic URL by Passport
- ❌ Doesn't match Apple Developer Console
- ❌ OAuth fails

---

## 📝 Summary

**Action Required:**
1. ✅ Set environment variable: `PRIMARY_DOMAIN=mytrainpro.com`
2. ✅ Restart the server
3. ✅ Verify startup logs show full callback URL
4. ✅ Test Apple OAuth login
5. ✅ Confirm session creation and dashboard access

**Expected Result:**
- ✅ Apple OAuth login completes successfully
- ✅ Session is created with userId
- ✅ User is redirected to dashboard
- ✅ No more "Invalid web redirect url" errors

**Confidence Level:** 95%+

This fix addresses the root cause of the Apple OAuth session creation failure.
