import {
  accountTable,
  authDataBase,
  sessionTable,
  userTable,
  verificationTable,
} from "@service/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { nextCookies } from "better-auth/next-js";
import { anonymous, customSession } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_PREFIX } from "../const";
import { logger } from "@/lib/logger";
export const getSession = async () => {
  "use server";
  const session = await solvesBetterAuth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      logger.error(e);
      return null;
    });
  if (!session) {
    logger.error("No session found");
    redirect("/sign-in");
  }
  return session!;
};

export const safeGetSession = async () => {
  "use server";
  const session = await solvesBetterAuth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      logger.error(e);
      return null;
    });
  return session;
};

const database = drizzleAdapter(authDataBase, {
  provider: "pg",
  schema: {
    user: userTable,
    session: sessionTable,
    account: accountTable,
    verification: verificationTable,
  },
});

export const solvesBetterAuth: ReturnType<typeof betterAuth> = betterAuth({
  database,
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    cookiePrefix: AUTH_COOKIE_PREFIX,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
  },
  account: {
    accountLinking: {
      trustedProviders: ["google"],
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    customSession(async ({ session, user }) => {
      return {
        session,
        user,
      };
    }),
    anonymous(),
    nextCookies(),
  ],
});
