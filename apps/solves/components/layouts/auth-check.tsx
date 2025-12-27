"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";

export function AuthCheck() {
  useEffect(() => {
    authClient.getSession({
      query: {
        disableCookieCache: true,
      },
    });
  }, []);
  return null;
}
