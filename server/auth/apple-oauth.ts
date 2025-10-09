import passport from "passport";
import { Strategy as AppleStrategy } from "passport-apple";
import jwt from "jsonwebtoken";
import { storage } from "../storage-db";
import type { Request } from "express";
import { deriveBaseUrlFromRequest } from "./oauth-utils";

interface AppleProfile {
  id: string;
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

let formattedApplePrivateKey = process.env.APPLE_PRIVATE_KEY || '';
if (formattedApplePrivateKey) {
  if (formattedApplePrivateKey.includes('\\n')) {
    formattedApplePrivateKey = formattedApplePrivateKey.replace(/\\n/g, '\n');
  }
  
  if (!formattedApplePrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('Invalid Apple private key format - missing BEGIN marker');
    formattedApplePrivateKey = '';
  } else if (!formattedApplePrivateKey.includes('-----END PRIVATE KEY-----')) {
    console.error('Invalid Apple private key format - missing END marker');
    formattedApplePrivateKey = '';
  } else {
    formattedApplePrivateKey = formattedApplePrivateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n')
      .replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');
  }
}

function generateAppleClientSecret(): string {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const serviceId = process.env.APPLE_SERVICES_ID;

  if (!teamId || !keyId || !serviceId || !formattedApplePrivateKey) {
    throw new Error("Missing Apple Sign In configuration");
  }

  const now = Math.floor(Date.now() / 1000);
  
  const claims = {
    iss: teamId,
    iat: now,
    exp: now + 86400 * 180, // 6 months
    aud: "https://appleid.apple.com",
    sub: serviceId,
  };

  return jwt.sign(claims, formattedApplePrivateKey, {
    algorithm: "ES256",
    keyid: keyId,
  });
}

export function setupAppleAuth() {
  const serviceId = process.env.APPLE_SERVICES_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;

  if (!serviceId || !teamId || !keyId || !formattedApplePrivateKey) {
    console.warn("Apple Sign In credentials not configured - skipping Apple auth setup");
    return;
  }

  try {
    const clientSecret = generateAppleClientSecret();

    passport.use(
      "apple",
      new AppleStrategy(
        {
          clientID: serviceId,
          teamID: teamId,
          callbackURL: "/api/auth/apple/callback",
          keyID: keyId,
          privateKeyString: formattedApplePrivateKey,
          passReqToCallback: true,
        },
        async (
          req: Request,
          accessToken: string,
          refreshToken: string,
          idToken: any,
          profile: AppleProfile,
          done: (error: any, user?: any) => void
        ) => {
          try {
            const actualCallbackUrl = `${deriveBaseUrlFromRequest(req)}/api/auth/apple/callback`;
            console.log(`🔗 Apple OAuth callback URL (from request): ${actualCallbackUrl}`);
            
            const appleId = profile.id || idToken?.sub;
            
            // Apple only provides email on first sign-in
            const email = profile.email || idToken?.email;
            const firstName = profile.name?.firstName;
            const lastName = profile.name?.lastName;

            if (!appleId) {
              return done(new Error("No Apple ID found in profile"));
            }

            // Check if user exists with this Apple ID
            let user = await storage.getUserByAppleId(appleId);

            if (user) {
              // User exists with this Apple ID - log them in
              console.log(`Apple Sign In: Existing user found with appleId: ${appleId}`);
              return done(null, { userId: user.id, provider: 'apple' });
            }

            // For new users, email is required
            if (!email) {
              return done(new Error("Email is required for new Apple Sign In users"));
            }

            // Check if user exists with this email
            user = await storage.getUserByEmail(email);

            if (user) {
              // User exists with same email - link Apple account
              if (user.appleId) {
                return done(new Error("This email is already linked to a different Apple account"));
              }

              console.log(`Apple Sign In: Linking Apple account to existing user: ${email}`);
              user = await storage.linkAppleAccount(user.id, appleId);
              return done(null, { userId: user.id, provider: 'apple', linked: true });
            }

            // Create new user with Apple account
            const displayName = firstName && lastName 
              ? `${firstName} ${lastName}`.trim() 
              : email.split('@')[0];

            console.log(`Apple Sign In: Creating new user with Apple account: ${email}`);
            user = await storage.createOAuthUser({
              appleId,
              email,
              name: displayName,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
            });

            return done(null, { userId: user.id, provider: 'apple', newUser: true });
          } catch (error: any) {
            console.error("Apple Sign In error:", error);
            return done(error);
          }
        }
      )
    );

    console.log("✅ Apple Sign In strategy configured with dynamic callback URL");
  } catch (error) {
    console.error("Failed to configure Apple Sign In:", error);
  }
}
