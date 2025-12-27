"use server";
import { policyService } from "@service/auth";
import { validateNickname } from "@service/auth/shared";
import { headers } from "next/headers";
import { getSession, solvesBetterAuth } from "@/lib/auth/server";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

export const deleteUserAction = safeAction(async () => {
  // 정책 미확정으로 아직 삭제 불가
});

export const updateProfileAction = safeAction(
  async (profile: {
    nickname?: string;
    image?: string;
    referralSource?: string;
    occupation?: string;
  }) => {
    const session = await getSession();
    if (profile.nickname && session.user.nickname === profile.nickname) return;
    if (profile.image && session.user.image === profile.image) return;
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

export const recordConsentAction = safeAction(
  async (consents: { policyVersionId: string; isAgreed: boolean }[]) => {
    const session = await getSession();
    const headersList = await headers();

    await policyService.recordConsent(session.user.id, consents, {
      ipAddress: headersList.get("x-forwarded-for") ?? undefined,
      userAgent: headersList.get("user-agent") ?? undefined,
    });

    // 동의 상태 업데이트
    await policyService.checkAndUpdateConsent(session.user.id);
  },
);
