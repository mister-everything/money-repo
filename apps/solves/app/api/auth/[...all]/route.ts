import { nextBetterAuth } from "@service/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(nextBetterAuth.handler);
