import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

/**
 * POST /api/workbooks/[id]/save
 * 답안 자동 저장 (10초 주기)
 * 변경된 답안만 DB에 저장 (upsert)
 */
export async function POST(request: NextRequest) {
  try {
    const { submitId, answers } = await request.json();

    const session = await getSession(); // 인증 확인

    if (!submitId) {
      return nextFail("세션 ID가 필요합니다.");
    }

    await workBookService.saveAnswerProgress(
      session.user.id,
      submitId,
      answers,
    );

    return nextOk({ saved: true });
  } catch (error) {
    logger.error("Error saving answer progress:", error);
    return nextFail("답안 저장 중 오류가 발생했습니다.");
  }
}
