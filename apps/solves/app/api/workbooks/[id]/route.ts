import { probService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

/**
 * GET /api/prob/[id]
 * 특정 문제집 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getSession();

    const hasPermission = await probService.hasProbBookPermission(
      id,
      session.user.id,
    );
    if (!hasPermission) {
      return nextFail("문제집에 접근할 수 없습니다.");
    }

    const probBook = await probService.selectProbBookById(id);

    if (!probBook) {
      return nextFail("문제집을 찾을 수 없습니다.");
    }

    return nextOk(probBook);
  } catch (error) {
    console.error("Error fetching prob book:", error);
    return nextFail("문제집 조회 중 오류가 발생했습니다.");
  }
}

/**
 * DELETE /api/prob/[id]
 * 특정 문제집 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await getSession();

    const isOwner = await probService.isProbBookOwner(id, session.user.id);
    if (!isOwner) {
      return nextFail("문제집에 접근할 수 없습니다.");
    }

    await probService.deleteProbBook(id);

    return nextOk("문제집이 성공적으로 삭제되었습니다.");
  } catch (error) {
    console.error("Error deleting prob book:", error);
    return nextFail("문제집 삭제 중 오류가 발생했습니다.");
  }
}
