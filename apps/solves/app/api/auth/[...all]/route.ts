import { toNextJsHandler } from "better-auth/next-js";
import { solvesBetterAuth } from "@/lib/auth/server";

export const { GET, POST } = toNextJsHandler(solvesBetterAuth.handler);
