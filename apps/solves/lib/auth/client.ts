"use client";

import { createAuthClient } from "better-auth/react";
export const authClient: ReturnType<typeof createAuthClient> =
  createAuthClient();
