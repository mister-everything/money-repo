"use server";

import { userService } from "@service/auth";
import { cookies } from "next/headers";

export async function setInviteTokenCookie(token: string) {
  const invitation = await userService.validateInvitation(token);

  if (!invitation) {
    return { success: false, error: "Invalid or expired invitation" };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_invite_token", token, {
    httpOnly: true,
    secure:
      process.env.NO_HTTPS === "1"
        ? false
        : process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return { success: true };
}

