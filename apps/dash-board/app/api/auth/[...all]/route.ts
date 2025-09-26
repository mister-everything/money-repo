import { nextBetterAuthForAdmin } from "@service/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(nextBetterAuthForAdmin.handler);
