import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

/**
 * GET /api/prob/[id]/submit
 * 특정 문제집 제출 결과 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workBook = await workBookService.getWorkBookWithoutAnswer(id);

    if (!workBook) {
      return nextFail("문제집을 찾을 수 없습니다.");
    }

    return nextOk(workBook);
  } catch (error) {
    logger.error("Error fetching prob book:", error);
    return nextFail(error);
  }
}

/**
 * POST /api/prob/[id]/submit
 * 특정 문제집 제출
 * submitId가 있으면 세션 기반 제출, 없으면 기존 방식 (하위 호환성)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { answer, submitId } = await request.json();

    let result;

    if (submitId) {
      // 세션 기반 제출
      result = await workBookService.submitWorkBookSession(
        submitId,
        id,
        answer,
      );
    }

    return nextOk(result);
  } catch (error) {
    logger.error("Error submitting prob book:", error);
    return nextFail(error);
  }
}
