"use server";
import { validateNickname } from "@service/auth/shared";
import { headers } from "next/headers";
import { solvesBetterAuth } from "@/lib/auth/server";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

export const deleteUserAction = safeAction(async () => {
  // 정책 미확정으로 아직 삭제 불가
});

export const updateProfileAction = safeAction(
  async (profile: { nickname?: string; image?: string }) => {
    if (profile.nickname) {
      const validation = validateNickname(profile.nickname);
      if (!validation.valid) return fail(validation.error!);
    }

    await solvesBetterAuth.api.updateUser({
      headers: await headers(),
      body: profile,
    });
  },
);
