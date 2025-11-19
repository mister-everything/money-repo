import {
  accountTable,
  authDataBase,
  sessionTable,
  userService,
  userTable,
  verificationTable,
} from "@service/auth";

import { IS_PROD } from "@workspace/util/const";
import { betterAuth, Session } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_PREFIX } from "../const";

export const getSession = async () => {
  "use server";
  const session = await adminBetterAuth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
  if (!session) {
    console.error("No session found");
    redirect("/sign-in");
  }
  return session!;
};

export const getUser = async () => {
  "use server";
  const session = await getSession();
  return session.user;
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

export const safeGetSession = async () => {
  "use server";
  const session = await adminBetterAuth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
  return session;
};

const sessionHook = async (session: Partial<Session>) => {
  const cookieStore = await cookies();
  const inviteToken = cookieStore.get("admin_invite_token")?.value;
  if (inviteToken) {
    try {
      await userService.consumeInvitation(inviteToken, session.userId!);
    } catch (error) {
      console.error("Failed to consume invite token:", error);
    } finally {
      cookieStore.delete("admin_invite_token");
    }
  }
  if (!IS_PROD) return true;
  return checkAdmin(session.userId);
};

export const adminBetterAuth: ReturnType<typeof betterAuth> = betterAuth({
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

  databaseHooks: {
    session: {
      create: {
        before: sessionHook,
      },
      update: {
        before: sessionHook,
      },
    },
  },
  plugins: [admin(), nextCookies()],
});

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
