
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import base64 from 'base-64';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = 'https://mytrainpro.com';

export class AuthManager {
  // Get the correct Google Client ID based on platform
  static getGoogleClientId() {
    const config = Constants.expoConfig?.extra;

    let clientId;
    if (Platform.OS === 'ios') {
      clientId = config?.googleClientIdIos;
    } else if (Platform.OS === 'android') {
      clientId = config?.googleClientIdAndroid;
    } else {
      clientId = config?.googleClientIdWeb;
    }

    console.log('[AuthManager] Platform:', Platform.OS);
    console.log('[AuthManager] Client ID configured:', clientId ? 'Yes' : 'No');

    if (!clientId) {
      throw new Error(`Google Client ID for ${Platform.OS} not configured in app.json`);
    }

    if (clientId.startsWith('$') || clientId.includes('YOUR_')) {
      throw new Error('Google Client ID is a placeholder. Please configure real Client ID in app.json');
    }

    return clientId;
  }

  // Generate PKCE challenge using cryptographically secure random
  static async generatePKCE() {
    try {
      // Generate code verifier from random bytes
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const codeVerifier = this.base64UrlEncodeRaw(
        Array.from(randomBytes).map(b => String.fromCharCode(b)).join('')
      );

      // Generate SHA-256 code challenge
      const hashBase64 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      // Convert to URL-safe base64
      const codeChallenge = this.base64ToBase64Url(hashBase64);

      console.log('[AuthManager] PKCE generated:', {
        verifierLength: codeVerifier.length,
        challengeLength: codeChallenge.length
      });

      return { codeVerifier, codeChallenge };
    } catch (error) {
      console.error('[AuthManager] PKCE generation failed:', error);
      throw error;
    }
  }

  // Base64url encode for raw strings
  static base64UrlEncodeRaw(str) {
    return base64.encode(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Convert base64 to base64url
  static base64ToBase64Url(base64Str) {
    return base64Str
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

  // Decode base64url JWT payload (robust version)
  static decodeJWTPayload(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Get payload (second part)
      let base64Url = parts[1];

      // Convert base64url to base64
      let base64String = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Add padding if needed
      const paddingNeeded = (4 - (base64String.length % 4)) % 4;
      base64String += '='.repeat(paddingNeeded);

      // Decode base64 to string
      const jsonString = base64.decode(base64String);

      // Parse JSON
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('[AuthManager] JWT decode error:', error);
      throw new Error(`Failed to decode JWT: ${error.message}`);
    }
  }

  // Google Sign In with PKCE
  static async signInWithGoogle() {
    let hasCleanedUp = false;

    try {
      console.log('[Google OAuth] ====== Starting Google Sign In ======');
      console.log('[Google OAuth] Platform:', Platform.OS);

      // Get client ID with validation
      const clientId = this.getGoogleClientId();
      console.log('[Google OAuth] Client ID:', clientId.substring(0, 30) + '...');

      // Create redirect URI
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'mytrainpro',
        path: 'auth/google'
      });
      console.log('[Google OAuth] Redirect URI:', redirectUri);

      // Generate PKCE parameters
      const { codeVerifier, codeChallenge } = await this.generatePKCE();

      // Generate state and nonce
      const state = await this.generateNonce();
      const nonce = await this.generateNonce();

      console.log('[Google OAuth] Generated security parameters');

      // Store parameters securely
      await SecureStore.setItemAsync('oauth_state', state);
      await SecureStore.setItemAsync('oauth_nonce', nonce);
      await SecureStore.setItemAsync('oauth_code_verifier', codeVerifier);

      // Build authorization URL
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `state=${encodeURIComponent(state)}&` +
        `nonce=${encodeURIComponent(nonce)}&` +
        `code_challenge=${encodeURIComponent(codeChallenge)}&` +
        `code_challenge_method=S256&` +
        `access_type=offline&` +
        `prompt=select_account`;

      console.log('[Google OAuth] Opening browser for authentication...');

      // Start OAuth session
      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri
      });

      console.log('[Google OAuth] Browser closed, result type:', result.type);

      // Handle cancelled
      if (result.type === 'cancel') {
        console.log('[Google OAuth] User cancelled sign in');
        hasCleanedUp = true;
        await this.cleanupOAuthData();
        return { success: false, error: 'Google sign in cancelled' };
      }

      // Handle error
      if (result.type === 'error') {
        console.error('[Google OAuth] OAuth error:', result.error);
        hasCleanedUp = true;
        await this.cleanupOAuthData();
        return { 
          success: false, 
          error: `Google sign in error: ${result.error?.message || 'Unknown error'}` 
        };
      }

      // Handle success
      if (result.type === 'success' && result.params.code) {
        console.log('[Google OAuth] Authorization code received');

        // Verify state parameter (CSRF protection)
        const savedState = await SecureStore.getItemAsync('oauth_state');
        if (result.params.state !== savedState) {
          console.error('[Google OAuth] State mismatch!');
          hasCleanedUp = true;
          await this.cleanupOAuthData();
          throw new Error('State parameter mismatch - possible CSRF attack');
        }

        // Retrieve stored parameters
        const savedNonce = await SecureStore.getItemAsync('oauth_nonce');
        const savedCodeVerifier = await SecureStore.getItemAsync('oauth_code_verifier');

        console.log('[Google OAuth] Exchanging authorization code for tokens...');

        // Exchange code for tokens
        const sessionData = await this.exchangeGoogleCode(
          result.params.code,
          savedCodeVerifier,
          redirectUri,
          savedNonce
        );

        // Clean up OAuth data
        hasCleanedUp = true;
        await this.cleanupOAuthData();

        // Save session
        await this.saveSession(sessionData);

        console.log('[Google OAuth] ====== Sign in successful ======');
        return { success: true, sessionData };
      }

      // Unknown result type
      console.error('[Google OAuth] Unexpected result type:', result.type);
      hasCleanedUp = true;
      await this.cleanupOAuthData();
      return { success: false, error: 'Unexpected OAuth result' };

    } catch (error) {
      console.error('[Google OAuth] ====== Sign in failed ======');
      console.error('[Google OAuth] Error:', error.message);
      console.error('[Google OAuth] Error details:', {
        name: error.name,
        code: error.code,
        stack: error.stack
      });

      // Clean up on error if not already done
      if (!hasCleanedUp) {
        try {
          await this.cleanupOAuthData();
        } catch (cleanupError) {
          console.error('[Google OAuth] Cleanup error:', cleanupError);
        }
      }

      return { 
        success: false, 
        error: error.message || 'Google sign in failed',
        details: {
          code: error.code,
          name: error.name
        }
      };
    }
  }

  // Clean up OAuth temporary data
  static async cleanupOAuthData() {
    try {
      await SecureStore.deleteItemAsync('oauth_state');
      await SecureStore.deleteItemAsync('oauth_nonce');
      await SecureStore.deleteItemAsync('oauth_code_verifier');
      console.log('[AuthManager] OAuth data cleaned up');
    } catch (error) {
      console.error('[AuthManager] Cleanup error:', error);
    }
  }

  // Helper function to encode form data
  static encodeFormData(params) {
    return Object.keys(params)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
      .join('&');
  }

  // Exchange authorization code for tokens
  static async exchangeGoogleCode(code, codeVerifier, redirectUri, nonce) {
    try {
      const clientId = this.getGoogleClientId();

      console.log('[Google OAuth] Step 1: Exchanging code at Google...');

      // Exchange code for tokens at Google
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: this.encodeFormData({
          code,
          client_id: clientId,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier
        })
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[Google OAuth] Token exchange failed:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        throw new Error(`Token exchange failed: ${errorData.error || errorData.error_description || 'Unknown error'}`);
      }

      const tokens = await tokenResponse.json();
      console.log('[Google OAuth] Received tokens from Google');

      // Decode and verify ID token
      console.log('[Google OAuth] Step 2: Decoding ID token...');
      const idTokenPayload = this.decodeJWTPayload(tokens.id_token);

      console.log('[Google OAuth] ID token payload:', {
        sub: idTokenPayload.sub,
        email: idTokenPayload.email,
        hasNonce: !!idTokenPayload.nonce
      });

      // Verify nonce
      if (idTokenPayload.nonce !== nonce) {
        console.error('[Google OAuth] Nonce mismatch!');
        throw new Error('Nonce mismatch - possible token replay attack');
      }

      console.log('[Google OAuth] Step 3: Authenticating with backend...');

      // Send to backend
      const backendResponse = await fetch(`${BACKEND_URL}/api/auth/google/mobile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          idToken: tokens.id_token,
          nonce: nonce,
          platform: Platform.OS
        }),
        credentials: 'include'
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('[Google OAuth] Backend authentication failed:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(`Backend authentication failed: ${errorData.message || errorData.error || 'Unknown error'}`);
      }

      const data = await backendResponse.json();

      console.log('[Google OAuth] Backend response:', {
        hasUser: !!data.user,
        userEmail: data.user?.email,
        hasSessionId: !!data.sessionId,
        hasCookieName: !!data.cookieName
      });

      // Construct cookie string
      let cookieString = '';
      if (data.sessionId && data.cookieName) {
        const maxAge = 7 * 24 * 60 * 60; // 1 week
        const secure = BACKEND_URL.startsWith('https') ? '; Secure' : '';
        cookieString = `${data.cookieName}=${data.sessionId}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;

        console.log('[Google OAuth] Cookie constructed:', {
          cookieName: data.cookieName,
          hasSessionId: !!data.sessionId
        });
      }

      return {
        user: data.user,
        cookies: cookieString,
        sessionId: data.sessionId,
        timestamp: Date.now(),
        provider: 'google'
      };

    } catch (error) {
      console.error('[Google OAuth] Code exchange error:', error);
      throw error;
    }
  }

  // Apple Sign In
  static async signInWithApple() {
    try {
      console.log('[Apple OAuth] ====== Starting Apple Sign In ======');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[Apple OAuth] Credential received:', {
        hasIdentityToken: !!credential.identityToken,
        hasUser: !!credential.user,
        hasEmail: !!credential.email
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      console.log('[Apple OAuth] Exchanging token with backend...');

      const sessionData = await this.exchangeAppleToken(
        credential.identityToken,
        credential.user || null,
        credential.fullName
      );

      await this.saveSession(sessionData);

      console.log('[Apple OAuth] ====== Sign in successful ======');
      return { success: true, sessionData };

    } catch (error) {
      console.error('[Apple OAuth] ====== Sign in failed ======');
      console.error('[Apple OAuth] Error:', error.message);

      if (error.code === 'ERR_CANCELED') {
        return { success: false, error: 'Apple sign in cancelled' };
      }

      return { 
        success: false, 
        error: error.message || 'Apple sign in failed',
        details: {
          code: error.code,
          name: error.name
        }
      };
    }
  }

  // Exchange Apple identity token
  static async exchangeAppleToken(identityToken, user, fullName) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/apple/mobile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          identityToken,
          user: fullName ? {
            fullName: {
              givenName: fullName.givenName,
              familyName: fullName.familyName
            }
          } : null,
          platform: Platform.OS
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Apple OAuth] Backend error:', errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(errorData.message || 'Token exchange failed');
      }

      const data = await response.json();

      console.log('[Apple OAuth] Backend response:', {
        hasUser: !!data.user,
        hasSessionId: !!data.sessionId
      });

      // Construct cookie string
      let cookieString = '';
      if (data.sessionId && data.cookieName) {
        const maxAge = 7 * 24 * 60 * 60;
        const secure = BACKEND_URL.startsWith('https') ? '; Secure' : '';
        cookieString = `${data.cookieName}=${data.sessionId}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
      }

      return {
        user: data.user,
        cookies: cookieString,
        sessionId: data.sessionId,
        timestamp: Date.now(),
        provider: 'apple'
      };

    } catch (error) {
      console.error('[Apple OAuth] Token exchange error:', error);
      throw error;
    }
  }

  // Session management
  static async saveSession(session) {
    try {
      await SecureStore.setItemAsync('user_session', JSON.stringify(session));
      console.log('[AuthManager] Session saved');
    } catch (error) {
      console.error('[AuthManager] Failed to save session:', error);
      throw error;
    }
  }

  static async getSession() {
    try {
      const sessionStr = await SecureStore.getItemAsync('user_session');
      if (!sessionStr) {
        return null;
      }

      const session = JSON.parse(sessionStr);

      // Validate session
      if (!session.user || !session.sessionId) {
        console.log('[AuthManager] Invalid session structure');
        await this.clearSession();
        return null;
      }

      // Check expiry (7 days)
      const age = Date.now() - (session.timestamp || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000;

      if (age > maxAge) {
        console.log('[AuthManager] Session expired');
        await this.clearSession();
        return null;
      }

      console.log('[AuthManager] Valid session found');
      return session;

    } catch (error) {
      console.error('[AuthManager] Failed to get session:', error);
      await this.clearSession();
      return null;
    }
  }

  static async clearSession() {
    try {
      await SecureStore.deleteItemAsync('user_session');
      console.log('[AuthManager] Session cleared');
    } catch (error) {
      console.error('[AuthManager] Failed to clear session:', error);
    }
  }

  static async isAppleSignInAvailable() {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      if (!AppleAuthentication || !AppleAuthentication.isAvailableAsync) {
        console.log('[AuthManager] Apple Authentication module not available');
        return false;
      }

      return await AppleAuthentication.isAvailableAsync();
    } catch (error) {
      console.error('[AuthManager] Apple availability check error:', error);
      return false;
    }
  }
}
