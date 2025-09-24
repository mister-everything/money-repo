"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    plugins: [adminClient()],
  },
);
