import { probService } from "@service/solves";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/response";

/**
 * GET /api/prob/[id]/session
 * 문제집 세션 시작 또는 재개
 * 진행 중인 세션이 있으면 해당 세션의 저장된 답안과 함께 반환
 * 없으면 새 세션을 생성하여 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const session = await getSession();

    const sessionData = await probService.startOrResumeProbBookSession(
      id,
      session.user.id,
    );

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error("Error starting/resuming prob book session:", error);
    return NextResponse.json(
      errorResponse("세션 시작 중 오류가 발생했습니다."),
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/workbooks/[id]/session
 * 세션 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const session = await getSession();
    await probService.deleteProbBookSession(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prob book session:", error);
    return NextResponse.json(
      errorResponse("세션 삭제 중 오류가 발생했습니다."),
      { status: 500 },
    );
  }
}
