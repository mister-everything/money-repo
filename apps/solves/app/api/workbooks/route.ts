import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

/**
 * GET /api/prob
 * 문제집 목록 조회
 * - Query Params:
 *   - ownerId (선택, 특정 사용자의 문제집만 조회)
 *   - public (선택, 공개된 문제집만 조회)
 */
export async function GET(request: NextRequest) {
  try {
    // @todo search Options

    const workBooks = await workBookService.searchWorkBooks();

    return nextOk(workBooks);
  } catch (error) {
    console.error("Error fetching prob books:", error);
    return nextFail("문제집 조회 중 오류가 발생했습니다.");
  }
}
