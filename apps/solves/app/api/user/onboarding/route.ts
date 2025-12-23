import { CURRENT_PRIVACY_VERSION, NicknameSchema } from "@service/auth/shared";
import { userService } from "@service/auth/user.service";
import { headers } from "next/headers";
import z from "zod";

import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

const CompleteOnboardingSchema = z.object({
  nickname: NicknameSchema,
  privacyVersion: z.string().optional().default(CURRENT_PRIVACY_VERSION),
});

/**
 * Request에서 IP 주소 추출
 */
async function getClientIp(): Promise<string | undefined> {
  const headersList = await headers();
  // Cloudflare, AWS ALB, nginx 등 다양한 프록시 헤더 확인
  return (
    headersList.get("cf-connecting-ip") ??
    headersList.get("x-real-ip") ??
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

/**
 * Request에서 User-Agent 추출
 */
async function getUserAgent(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get("user-agent") ?? undefined;
}

/**
 * GET /api/user/onboarding
 * 온보딩 상태 조회
 */
export async function GET() {
  try {
    const session = await getSession();
    const [extendedData, hasPrivacyConsent] = await Promise.all([
      userService.getUserExtendedData(session.user.id),
      userService.hasPrivacyConsent(session.user.id),
    ]);

    return nextOk({
      nickname: extendedData?.nickname ?? null,
      hasPrivacyConsent,
      isComplete: hasPrivacyConsent && !!extendedData?.nickname,
    });
  } catch (error) {
    return nextFail(error, 500);
  }
}

/**
 * POST /api/user/onboarding
 * 온보딩 완료 (닉네임 설정 + 개인정보 동의)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { nickname, privacyVersion } = CompleteOnboardingSchema.parse(body);

    // IP 주소와 User-Agent 추출 (법적 증빙용)
    const ipAddress = await getClientIp();
    const userAgent = await getUserAgent();

    await userService.completeOnboarding(
      session.user.id,
      nickname,
      privacyVersion,
      {
        ipAddress,
        userAgent,
      },
    );

    return nextOk({ success: true });
  } catch (error) {
    return nextFail(error, 400);
  }
}
