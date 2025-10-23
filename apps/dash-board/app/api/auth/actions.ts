"use server";
import { nextBetterAuthForAdmin, userService } from "@service/auth";
import { headers } from "next/headers";

export async function checkSession() {
  const session = await nextBetterAuthForAdmin.api
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
