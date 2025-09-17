import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, anonymous, jwt } from "better-auth/plugins";
import {
  AccountTable,
  JwksTable,
  SessionTable,
  UserTable,
  VerificationTable,
} from ".";
import { pgDb } from "./db";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    "\n\n⚠️ [AUTH Service] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required\n\n",
  );
}

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(pgDb, {
    provider: "pg",
    schema: {
      user: UserTable,
      session: SessionTable,
      account: AccountTable,
      verification: VerificationTable,
      jwks: JwksTable,
    },
  }),
  advanced: {
    useSecureCookies:
      process.env.NO_HTTPS == "1"
        ? false
        : process.env.NODE_ENV === "production",
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
  plugins: [jwt(), anonymous(), admin()],
}) satisfies ReturnType<typeof betterAuth>;
