"use server";

import { userService } from "@service/auth";
import { getUser } from "@/lib/auth/server";

export async function createInviteToken() {
  const user = await getUser();
  const invitation = await userService.createInvitation(user.id);

  return invitation.token;
}

export async function getInvitations() {
  await getUser(); // Check if user is authenticated
  const invitations = await userService.getAllInvitations();

  return invitations.map((inv) => ({
    id: inv.id,
    token: inv.token,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString(),
    usedAt: inv.usedAt?.toISOString() || null,
    usedBy: inv.usedBy,
    usedByUser: inv.usedByUser,
  }));
}
