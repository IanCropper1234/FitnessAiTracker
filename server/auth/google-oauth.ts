import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "../storage-db";
import type { Request } from "express";

interface GoogleProfile {
  id: string;
  emails?: { value: string; verified?: boolean }[];
  displayName?: string;
  name?: { givenName?: string; familyName?: string };
  photos?: { value: string }[];
}

export function setupGoogleAuth() {
  const clientID = process.env.GOOGLE_CLIENT_ID_WEB;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth credentials not configured - skipping Google auth setup");
    return;
  }

  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "/api/auth/google/callback",
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;
          const displayName = profile.displayName || `${firstName || ''} ${lastName || ''}`.trim();
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Check if user exists with this Google ID
          let user = await storage.getUserByGoogleId(googleId);

          if (user) {
            // User exists with this Google ID - log them in
            console.log(`Google OAuth: Existing user found with googleId: ${googleId}`);
            return done(null, { userId: user.id, provider: 'google' });
          }

          // Check if user exists with this email
          user = await storage.getUserByEmail(email);

          if (user) {
            // User exists with same email - link Google account
            if (user.googleId) {
              return done(new Error("This email is already linked to a different Google account"));
            }

            console.log(`Google OAuth: Linking Google account to existing user: ${email}`);
            user = await storage.linkGoogleAccount(user.id, googleId);
            return done(null, { userId: user.id, provider: 'google', linked: true });
          }

          // Create new user with Google account
          console.log(`Google OAuth: Creating new user with Google account: ${email}`);
          user = await storage.createOAuthUser({
            googleId,
            email,
            name: displayName || email,
            firstName,
            lastName,
            profileImageUrl,
          });

          return done(null, { userId: user.id, provider: 'google', newUser: true });
        } catch (error: any) {
          console.error("Google OAuth error:", error);
          return done(error);
        }
      }
    )
  );

  console.log("✅ Google OAuth strategy configured");
}
