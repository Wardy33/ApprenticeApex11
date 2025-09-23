import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { neon_run_sql } from "./neon";

// Production Google OAuth Configuration
const googleOAuthConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL:
    process.env.NODE_ENV === "production"
      ? "https://apprenticeapex.com/auth/google/callback"
      : "http://localhost:3002/auth/google/callback",

  // OAuth scopes
  scope: ["profile", "email"],

  // Additional security options
  accessType: "offline",
  prompt: "consent",
};

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: googleOAuthConfig.clientID,
      clientSecret: googleOAuthConfig.clientSecret,
      callbackURL: googleOAuthConfig.callbackURL,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: (err: any, user?: any) => void,
    ) => {
      try {
        console.log(
          `🔐 Google OAuth: Processing login for ${profile.emails?.[0]?.value}`,
        );

        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const profilePicture = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        // Check if user already exists
        const existingUser = await neon_run_sql({
          sql: `
        SELECT id, email, name, role, email_verified, google_id, profile_picture_url
        FROM users 
        WHERE email = $1 OR google_id = $2
        LIMIT 1
      `,
          projectId: process.env.NEON_PROJECT_ID!,
          params: [email.toLowerCase(), googleId],
        });

        if (existingUser && existingUser.length > 0) {
          const user = existingUser[0];

          // Update Google ID and profile picture if not set
          if (!user.google_id || user.profile_picture_url !== profilePicture) {
            await neon_run_sql({
              sql: `
            UPDATE users 
            SET google_id = $2, 
                profile_picture_url = $3,
                last_login_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `,
              projectId: process.env.NEON_PROJECT_ID!,
              params: [user.id, googleId, profilePicture],
            });
          }

          console.log(`✅ Existing user logged in: ${user.email}`);
          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            email_verified: true,
            profile_picture_url: profilePicture,
          });
        }

        // Create new candidate user
        console.log(`👤 Creating new candidate account for: ${email}`);

        const newUser = await neon_run_sql({
          sql: `
        INSERT INTO users (
          email, name, role, email_verified, google_id, profile_picture_url,
          created_at, updated_at, last_login_at
        ) VALUES ($1, $2, 'candidate', true, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, email, name, role, email_verified, profile_picture_url
      `,
          projectId: process.env.NEON_PROJECT_ID!,
          params: [email.toLowerCase(), name, googleId, profilePicture],
        });

        if (!newUser || newUser.length === 0) {
          return done(new Error("Failed to create user account"), null);
        }

        const user = newUser[0];

        // Create candidate profile
        await neon_run_sql({
          sql: `
        INSERT INTO candidates (user_id, created_at, updated_at)
        VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
          projectId: process.env.NEON_PROJECT_ID!,
          params: [user.id],
        });

        console.log(`✅ New candidate account created: ${user.email}`);

        return done(null, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          email_verified: true,
          profile_picture_url: profilePicture,
        });
      } catch (error) {
        console.error("❌ Google OAuth error:", error);
        return done(error, null);
      }
    },
  ),
);

// Serialize user for session
passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(
  async (userId: string, done: (err: any, user?: any) => void) => {
    try {
      const user = await neon_run_sql({
        sql: `
        SELECT id, email, name, role, email_verified, profile_picture_url
        FROM users 
        WHERE id = $1
        LIMIT 1
      `,
        projectId: process.env.NEON_PROJECT_ID!,
        params: [userId],
      });

      if (user && user.length > 0) {
        done(null, user[0]);
      } else {
        done(new Error("User not found"), null);
      }
    } catch (error) {
      done(error, null);
    }
  },
);

// OAuth route handlers
export const googleOAuthRoutes = {
  // Initiate OAuth
  authenticate: passport.authenticate("google", {
    scope: googleOAuthConfig.scope,
    accessType: googleOAuthConfig.accessType,
    prompt: googleOAuthConfig.prompt,
  }),

  // OAuth callback
  callback: passport.authenticate("google", {
    failureRedirect: "/candidate/signin?error=oauth_failed",
    session: false, // We'll use JWT instead of sessions
  }),

  // Success handler
  success: (req: any, res: any) => {
    try {
      const jwt = require("jsonwebtoken");

      const token = jwt.sign(
        {
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role,
          name: req.user.name,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: "7d",
        },
      );

      // Redirect to candidate dashboard with token
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? `https://apprenticeapex.com/candidate/dashboard?token=${token}`
          : `http://localhost:5204/candidate/dashboard?token=${token}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error generating JWT after OAuth:", error);
      res.redirect("/candidate/signin?error=token_generation_failed");
    }
  },
};

// Validate OAuth configuration
export function validateOAuthConfig(): boolean {
  const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing Google OAuth configuration: ${missing.join(", ")}`,
    );
    return false;
  }

  console.log("✅ Google OAuth configuration validated");
  return true;
}

// Test OAuth connection
export async function testOAuthConnection(): Promise<boolean> {
  try {
    // Test that we can create a strategy without errors
    const testStrategy = new GoogleStrategy(
      {
        clientID: googleOAuthConfig.clientID,
        clientSecret: googleOAuthConfig.clientSecret,
        callbackURL: googleOAuthConfig.callbackURL,
      },
      () => {},
    );

    console.log("✅ Google OAuth strategy test passed");
    return true;
  } catch (error) {
    console.error("❌ Google OAuth strategy test failed:", error);
    return false;
  }
}

export { googleOAuthConfig };
export default passport;
