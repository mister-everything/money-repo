import { toNextJsHandler } from "better-auth/next-js";
import { adminBetterAuth } from "@/lib/auth/server";

export const { GET, POST } = toNextJsHandler(adminBetterAuth.handler);
