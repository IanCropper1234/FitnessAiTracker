import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { encode as btoa, decode as atob } from 'base-64';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = 'https://mytrainpro.com';

export class AuthManager {
  // Generate PKCE challenge using cryptographically secure random
  static async generatePKCE() {
    // Generate code verifier from random bytes
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const codeVerifier = this.base64UrlEncodeRaw(
      Array.from(randomBytes).map(b => String.fromCharCode(b)).join('')
    );
    
    // Generate SHA-256 code challenge
    // digestStringAsync returns base64 when encoding is BASE64
    const hashBase64 = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    // hashBase64 is already base64, only convert to URL-safe (no btoa!)
    const codeChallenge = this.base64ToBase64Url(hashBase64);
    
    return { codeVerifier, codeChallenge };
  }

  // Base64url encode for raw strings (needs btoa)
  static base64UrlEncodeRaw(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Convert already base64-encoded string to base64url (only replace characters)
  static base64ToBase64Url(base64Str) {
    return base64Str
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Legacy method for backward compatibility
  static base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate cryptographically secure nonce
  static async generateNonce() {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Google Sign In with PKCE
  static async signInWithGoogle() {
    try {
      const clientId = Platform.OS === 'ios' 
        ? Constants.expoConfig?.extra?.googleClientIdIos
        : Constants.expoConfig?.extra?.googleClientIdWeb;

      // Diagnostic logs
      console.log('[Google OAuth] Starting Google Sign In...');
      console.log('[Google OAuth] Platform:', Platform.OS);
      console.log('[Google OAuth] Client ID:', clientId ? clientId.substring(0, 30) + '...' : 'NOT CONFIGURED');

      // Validate client ID configuration
      if (!clientId) {
        throw new Error('Google Client ID not configured. Please check app.json configuration.');
      }

      if (clientId.startsWith('$')) {
        throw new Error('Google Client ID contains environment variable placeholder. Please run: node scripts/configure-app-json.js');
      }

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'mytrainpro',
        path: 'auth/google'
      });

      console.log('[Google OAuth] Redirect URI:', redirectUri);

      // Generate PKCE parameters using cryptographically secure random
      const { codeVerifier, codeChallenge } = await this.generatePKCE();
      
      // Generate cryptographically secure state for CSRF protection
      const state = await this.generateNonce();
      
      // Generate cryptographically secure nonce for ID token validation
      const nonce = await this.generateNonce();

      // Store state, nonce, and code verifier for verification
      await SecureStore.setItemAsync('oauth_state', state);
      await SecureStore.setItemAsync('oauth_nonce', nonce);
      await SecureStore.setItemAsync('oauth_code_verifier', codeVerifier);

      // Build authorization URL with PKCE (Authorization Code flow)
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +  // Authorization Code flow (not id_token)
        `scope=${encodeURIComponent('openid profile email')}&` +
        `state=${encodeURIComponent(state)}&` +
        `nonce=${encodeURIComponent(nonce)}&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256`;

      // Start OAuth session
      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri
      });

      if (result.type === 'success' && result.params.code) {
        // Verify state parameter to prevent CSRF attacks
        const savedState = await SecureStore.getItemAsync('oauth_state');
        if (result.params.state !== savedState) {
          throw new Error('State parameter mismatch - possible CSRF attack');
        }

        // Retrieve stored nonce and code verifier
        const savedNonce = await SecureStore.getItemAsync('oauth_nonce');
        const savedCodeVerifier = await SecureStore.getItemAsync('oauth_code_verifier');

        // Exchange authorization code for tokens
        const sessionData = await this.exchangeGoogleCode(
          result.params.code,
          savedCodeVerifier,
          redirectUri,
          savedNonce
        );
        
        // Clear stored OAuth data
        await SecureStore.deleteItemAsync('oauth_state');
        await SecureStore.deleteItemAsync('oauth_nonce');
        await SecureStore.deleteItemAsync('oauth_code_verifier');
        
        await this.saveSession(sessionData);
        return { success: true, sessionData };
      }

      console.log('[Google OAuth] User cancelled sign in');
      return { success: false, error: 'Google sign in cancelled' };
    } catch (error) {
      console.error('[Google OAuth] Detailed error:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      // Clean up on error
      try {
        await SecureStore.deleteItemAsync('oauth_state');
        await SecureStore.deleteItemAsync('oauth_nonce');
        await SecureStore.deleteItemAsync('oauth_code_verifier');
      } catch (cleanupError) {
        console.error('[Google OAuth] Cleanup error:', cleanupError);
      }
      
      return { 
        success: false, 
        error: `Google sign in failed: ${error.message}`,
        details: error.code || error.name
      };
    }
  }

  // Exchange authorization code for ID token with PKCE
  static async exchangeGoogleCode(code, codeVerifier, redirectUri, nonce) {
    const clientId = Platform.OS === 'ios' 
      ? Constants.expoConfig?.extra?.googleClientIdIos
      : Constants.expoConfig?.extra?.googleClientIdWeb;

    // 1. Exchange code for tokens at Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error || 'Unknown error'}`);
    }

    const tokens = await tokenResponse.json();
    
    // 2. Decode ID token payload (Fix: Add padding)
    const idTokenParts = tokens.id_token.split('.');
    if (idTokenParts.length !== 3) {
      throw new Error('Invalid ID token format');
    }
    
    let idTokenPayloadBase64Url = idTokenParts[1];
    
    // Convert base64url → base64
    let standardBase64 = idTokenPayloadBase64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Fix: Add padding ('=' characters) until length % 4 === 0
    while (standardBase64.length % 4 !== 0) {
      standardBase64 += '=';
    }
    
    // Use base-64 package's decode (atob) - works in React Native
    const idTokenPayload = JSON.parse(atob(standardBase64));
    
    // 3. Verify nonce
    if (idTokenPayload.nonce !== nonce) {
      throw new Error('Nonce mismatch - possible token replay attack');
    }

    // 4. Send ID token AND nonce to backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/auth/google/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        idToken: tokens.id_token,
        nonce: nonce
      }),
      credentials: 'include'
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('Backend authentication failed:', errorData);
      throw new Error('Backend authentication failed');
    }

    const data = await backendResponse.json();
    
    console.log('[Google OAuth] Backend response:', {
      hasUser: !!data.user,
      hasSessionId: !!data.sessionId,
      hasCookieName: !!data.cookieName
    });
    
    // Construct mobile-specific cookie string for WebView injection
    // Note: Fetch API cannot access httpOnly cookies from Set-Cookie header
    // So we use the mobile-specific cookie returned in the response body
    let cookieString = '';
    if (data.sessionId && data.cookieName) {
      // Build cookie string that JavaScript can set
      const maxAge = 7 * 24 * 60 * 60; // 1 week in seconds
      const secure = BACKEND_URL.startsWith('https') ? '; Secure' : '';
      cookieString = `${data.cookieName}=${data.sessionId}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      
      console.log('[Google OAuth] Constructed cookie:', {
        cookieName: data.cookieName,
        sessionId: data.sessionId.substring(0, 10) + '...'
      });
    }
    
    return {
      user: data.user,
      cookies: cookieString,
      sessionId: data.sessionId,
      timestamp: Date.now()
    };
  }

  static async signInWithApple() {
    try {
      console.log('[Apple OAuth] Starting Apple Sign In...');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[Apple OAuth] Received credential:', {
        hasIdentityToken: !!credential.identityToken,
        hasUser: !!credential.user,
        hasEmail: !!credential.email,
        hasFullName: !!credential.fullName
      });

      if (credential.identityToken) {
        console.log('[Apple OAuth] Exchanging identity token with backend...');
        const sessionData = await this.exchangeAppleToken(
          credential.identityToken,
          credential.user || null,
          credential.fullName
        );
        await this.saveSession(sessionData);
        console.log('[Apple OAuth] Sign in successful');
        return { success: true, sessionData };
      }

      console.log('[Apple OAuth] No identity token received');
      return { success: false, error: 'Apple sign in failed: No identity token received' };
    } catch (error) {
      console.error('[Apple OAuth] Detailed error:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      return { 
        success: false, 
        error: `Apple sign in failed: ${error.message}`,
        details: error.code || error.name
      };
    }
  }

  static async exchangeAppleToken(identityToken, user, fullName) {
    const response = await fetch(`${BACKEND_URL}/api/auth/apple/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identityToken,
        user: fullName ? {
          fullName: {
            givenName: fullName.givenName,
            familyName: fullName.familyName
          }
        } : null
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Token exchange failed');
    }

    const data = await response.json();
    
    console.log('[Apple OAuth] Backend response:', {
      hasUser: !!data.user,
      hasSessionId: !!data.sessionId,
      hasCookieName: !!data.cookieName
    });
    
    // Construct mobile-specific cookie string for WebView injection
    // Note: Fetch API cannot access httpOnly cookies from Set-Cookie header
    // So we use the mobile-specific cookie returned in the response body
    let cookieString = '';
    if (data.sessionId && data.cookieName) {
      // Build cookie string that JavaScript can set
      const maxAge = 7 * 24 * 60 * 60; // 1 week in seconds
      const secure = BACKEND_URL.startsWith('https') ? '; Secure' : '';
      cookieString = `${data.cookieName}=${data.sessionId}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      
      console.log('[Apple OAuth] Constructed cookie:', {
        cookieName: data.cookieName,
        sessionId: data.sessionId.substring(0, 10) + '...'
      });
    }
    
    return {
      user: data.user,
      cookies: cookieString,
      sessionId: data.sessionId,
      timestamp: Date.now()
    };
  }

  static async saveSession(session) {
    await SecureStore.setItemAsync('user_session', JSON.stringify(session));
  }

  static async getSession() {
    const sessionStr = await SecureStore.getItemAsync('user_session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  static async clearSession() {
    await SecureStore.deleteItemAsync('user_session');
  }

  static async isAppleSignInAvailable() {
    try {
      // Check if the module is available first
      if (!AppleAuthentication || !AppleAuthentication.isAvailableAsync) {
        console.log('[AuthManager] Apple Authentication module not available');
        return false;
      }
      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.log('[AuthManager] Apple Sign In availability check error:', error);
      return false;
    }
  }
}
