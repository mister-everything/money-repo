"use server";

import { userService } from "@service/auth";
import { Role } from "@service/auth/shared";
import { walletService } from "@service/solves";
import { revalidatePath } from "next/cache";
import z from "zod";
import { getUser } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

export const updateUserRoleAction = safeAction(
  z.object({
    userId: z.string(),
    role: z.string(),
  }),
  async ({ userId, role }) => {
    await getUser(); // Check if user is authenticated

    if (role !== Role.USER && role !== Role.ADMIN) {
      throw new Error("Invalid role");
    }

    await userService.updateUserRole(userId, role);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");

    return { success: true };
  },
);

export const banUserAction = safeAction(
  z.object({
    userId: z.string(),
    reason: z.string().min(1, "밴 사유를 입력해주세요."),
    expiresAt: z.string().optional(),
  }),
  async ({ userId, reason, expiresAt }) => {
    await getUser(); // Check if user is authenticated

    const banExpiresDate = expiresAt ? new Date(expiresAt) : null;

    await userService.banUser(userId, reason, banExpiresDate);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");

    return { success: true };
  },
);

export const unbanUserAction = safeAction(
  z.object({
    userId: z.string(),
  }),
  async ({ userId }) => {
    await getUser(); // Check if user is authenticated

    await userService.unbanUser(userId);
    revalidatePath(`/users/${userId}`);
    revalidatePath("/users");

    return { success: true };
  },
);

export async function getUserDetail(userId: string) {
  await getUser(); // Check if user is authenticated

  const user = await userService.getUserById(userId);
  const wallet = await walletService.getOrCreateWallet(userId);

  // TEST 후 어드민 권한 추가 예정
  if (!user) {
    return null;
  }

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    banExpires: user.banExpires?.toISOString() || null,
    balance: Number(wallet.balance ?? 0),
  };
}
