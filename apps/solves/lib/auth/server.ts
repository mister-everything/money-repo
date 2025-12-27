import {
  accountTable,
  authDataBase,
  policyService,
  sessionTable,
  userTable,
  verificationTable,
} from "@service/auth";
import { Role } from "@service/auth/shared";
import { isNull } from "@workspace/util";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createLogger } from "@/lib/logger";
import { AUTH_COOKIE_PREFIX } from "../const";
import { sharedCache } from "../server-cache";

const logger = createLogger("AUTH", "bgWhite");

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

export const solvesBetterAuth = betterAuth({
  database,
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
    cookiePrefix: AUTH_COOKIE_PREFIX,
  },
  user: {
    additionalFields: {
      role: {
        type: Object.values(Role),
        required: false,
        defaultValue: Role.USER,
        input: false,
      },
      nickname: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      publicId: {
        type: "number",
        input: false,
      },
      consentedAt: {
        type: "date",
        required: false,
        defaultValue: null,
        input: true,
      },
      referralSource: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      occupation: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        async before(session) {
          try {
            logger.debug("Checking consent for user:", session.userId);
            await policyService.checkAndUpdateConsent(session.userId);
          } catch (error) {
            logger.error("Failed to check consent:", error);
            return false;
          }
          return true;
        },
      },
    },
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
  secondaryStorage: {
    delete: (key) => {
      logger.debug(`delete secondary storage: ${key}`);
      return sharedCache.del(key);
    },
    get: async (key) => {
      const value = await sharedCache.get(key);
      logger.debug(`get secondary storage: ${key}`);
      if (isNull(value)) return undefined;
      return JSON.parse(value);
    },
    set: (key, value, ttl) => {
      logger.debug(`set secondary storage: ${key}, ttl: ${ttl}`);
      return sharedCache.set(key, value, ttl);
    },
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [anonymous(), nextCookies()],
});
