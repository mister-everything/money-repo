"use server";

import { userService } from "@service/auth";
import { Role } from "@service/auth/shared";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/server";

export async function updateUserRole(userId: string, role: string) {
  await getUser(); // Check if user is authenticated

  if (role !== Role.USER && role !== Role.ADMIN) {
    throw new Error("Invalid role");
  }

  await userService.updateUserRole(userId, role);
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");

  return { success: true };
}

export async function banUser(
  userId: string,
  reason: string,
  expiresAt?: string,
) {
  await getUser(); // Check if user is authenticated

  if (!reason.trim()) {
    throw new Error("밴 사유를 입력해주세요.");
  }

  const banExpiresDate = expiresAt ? new Date(expiresAt) : null;

  await userService.banUser(userId, reason, banExpiresDate);
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");

  return { success: true };
}

export async function unbanUser(userId: string) {
  await getUser(); // Check if user is authenticated

  await userService.unbanUser(userId);
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");

  return { success: true };
}

export async function getUserDetail(userId: string) {
  await getUser(); // Check if user is authenticated

  const user = await userService.getUserById(userId);

  if (!user) {
    return null;
  }

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    banExpires: user.banExpires?.toISOString() || null,
  };
}
