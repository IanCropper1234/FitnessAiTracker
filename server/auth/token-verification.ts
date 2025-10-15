import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Google OAuth Client - properly configured for both web and iOS clients
const googleClient = new OAuth2Client();

// Log Google client ID configuration for debugging
console.log('🔧 Google OAuth Configuration:', {
  webClientId: process.env.GOOGLE_CLIENT_ID_WEB ? 'configured' : 'not configured',
  iosClientId: process.env.GOOGLE_CLIENT_ID_IOS ? 'configured' : 'not configured',
  androidClientId: process.env.GOOGLE_CLIENT_ID_ANDROID ? 'configured' : 'not configured'
});

// Apple JWKS Client for public key retrieval
const appleJwksClient = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Get Apple signing key
function getAppleSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  appleJwksClient.getSigningKey(header.kid!, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Verify Google ID Token
 * @param idToken - The Google ID token from mobile app
 * @returns Verified token payload
 */
export async function verifyGoogleIdToken(idToken: string) {
  // Declare variables outside try block for proper scoping
  let tokenPayload: jwt.JwtPayload | undefined;
  let validAudiences: string[];
  
  try {
    // First decode the token to check the audience for debugging
    const decodedToken = jwt.decode(idToken, { complete: true });
    tokenPayload = decodedToken?.payload as jwt.JwtPayload | undefined;
    
    console.log('🔍 Google token audience received:', tokenPayload?.aud);
    
    // Configure valid audiences - accepting web, iOS, and Android client IDs
    validAudiences = [
      process.env.GOOGLE_CLIENT_ID_WEB,
      process.env.GOOGLE_CLIENT_ID_IOS,
      process.env.GOOGLE_CLIENT_ID_ANDROID
    ].filter(Boolean) as string[];
    
    console.log('🔍 Valid Google audiences:', validAudiences);
    
    // Verify the token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: validAudiences
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    // Verify issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      console.error('❌ Invalid Google token issuer:', {
        received: payload.iss,
        expected: validIssuers
      });
      throw new Error('Invalid token issuer');
    }

    // Verify expiry (already done by verifyIdToken, but we double-check)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token has expired');
    }

    console.log('✅ Google token verified successfully:', {
      sub: payload.sub,
      email: payload.email,
      iss: payload.iss,
      aud: payload.aud
    });

    return ticket;
  } catch (error: any) {
    console.error('❌ Google token verification failed:', {
      error: error.message,
      receivedAudience: tokenPayload?.aud,
      expectedAudiences: validAudiences
    });
    throw new Error(`Google token verification failed: ${error.message}`);
  }
}

/**
 * Verify Apple Identity Token
 * @param identityToken - The Apple identity token from mobile app
 * @returns Decoded and verified token payload
 */
export async function verifyAppleIdToken(identityToken: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    // First decode to get the header and check audience
    const decoded = jwt.decode(identityToken, { complete: true });
    
    if (!decoded || typeof decoded === 'string') {
      return reject(new Error('Invalid Apple token format'));
    }

    // Log the actual audience from the token for debugging
    const tokenPayload = decoded.payload as jwt.JwtPayload;
    console.log('🔍 Apple token audience received:', tokenPayload.aud);
    
    // Accept both web service ID and iOS bundle ID as valid audiences
    const validAudiences = [
      process.env.APPLE_SERVICES_ID,
      process.env.APPLE_BUNDLE_ID,
      'com.trainpro.app' // Native iOS bundle ID
    ].filter(Boolean);
    
    console.log('🔍 Valid Apple audiences:', validAudiences);

    // Verify the token with Apple's public key
    jwt.verify(
      identityToken,
      getAppleSigningKey,
      {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience: validAudiences
      },
      (err: jwt.VerifyErrors | null, decodedToken: string | jwt.JwtPayload | undefined) => {
        if (err) {
          console.error('❌ Apple token verification failed:', {
            error: err.message,
            receivedAudience: tokenPayload.aud,
            expectedAudiences: validAudiences
          });
          return reject(new Error(`Apple token verification failed: ${err.message}`));
        }

        if (!decodedToken || typeof decodedToken === 'string') {
          return reject(new Error('Invalid Apple token payload'));
        }

        // Additional expiry check
        const now = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < now) {
          return reject(new Error('Apple token has expired'));
        }

        console.log('✅ Apple token verified successfully:', {
          sub: decodedToken.sub,
          email: decodedToken.email,
          iss: decodedToken.iss,
          aud: decodedToken.aud
        });

        resolve(decodedToken as jwt.JwtPayload);
      }
    );
  });
}

/**
 * Validate token structure before verification
 */
export function validateTokenStructure(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  return true;
}
