import { BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, anonymous } from "better-auth/plugins";
import { GoogleOptions } from "better-auth/social-providers";
import {
  accountTable,
  sessionTable,
  userService,
  userTable,
  verificationTable,
} from ".";
import { AUTH_COOKIE_PREFIX, SERVICE_NAME } from "./const";
import { pgDb } from "./db";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    `\n\n⚠️ [${SERVICE_NAME}] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required\n\n`,
  );
}

const database = drizzleAdapter(pgDb, {
  provider: "pg",
  schema: {
    user: userTable,
    session: sessionTable,
    account: accountTable,
    verification: verificationTable,
  },
});

const advanced: BetterAuthOptions["advanced"] = {
  useSecureCookies:
    process.env.NO_HTTPS == "1" ? false : process.env.NODE_ENV === "production",
};

const session: BetterAuthOptions["session"] = {
  cookieCache: {
    enabled: true,
    maxAge: 60 * 60,
  },
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
};

const account: BetterAuthOptions["account"] = {
  accountLinking: {
    trustedProviders: ["google"],
  },
};

const socialProviders: BetterAuthOptions["socialProviders"] = {
  google: {
    prompt: "select_account",
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
};

const checkAdmin = async (id?: string) => {
  if (!id) {
    console.error("User is not admin");
    return false;
  }
  const isAdmin = await userService.isAdmin(id);
  if (!isAdmin) {
    console.error("User is not admin");
    return false;
  }
  return true;
};

// Default Auth
export const nextBetterAuth: ReturnType<typeof betterAuth> = betterAuth({
  database,
  advanced,
  session,
  account,
  socialProviders,
  plugins: [anonymous(), nextCookies()],
});

// Admin Auth
export const nextBetterAuthForAdmin: ReturnType<typeof betterAuth> = betterAuth(
  {
    database,
    advanced: {
      ...advanced,
      cookiePrefix: AUTH_COOKIE_PREFIX,
    },
    session,
    account,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    socialProviders: {
      google: {
        ...(socialProviders.google as GoogleOptions),
        disableSignUp: true,
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            return checkAdmin(session.userId);
          },
        },
        update: {
          before: async (session) => {
            return checkAdmin(session.userId);
          },
        },
      },
    },
    plugins: [admin(), nextCookies()],
  },
);
