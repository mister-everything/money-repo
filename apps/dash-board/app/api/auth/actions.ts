"use server";
import { userService } from "@service/auth";
import { headers } from "next/headers";
import { adminBetterAuth } from "@/lib/auth/server";

export async function checkSession() {
  const session = await adminBetterAuth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.error(e);
      return null;
    });
  const sessionId = session?.session.id;
  const userId = session?.user.id;
  if (sessionId && userId) {
    const isSessionValid = await userService.isSessionValid(sessionId, userId);
    if (isSessionValid) return session.user;
  }

  throw new Error("Session is not valid");
}
