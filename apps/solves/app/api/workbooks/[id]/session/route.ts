import { probService } from "@service/solves";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail } from "@/lib/protocol/next-route-helper";

/**
 * GET /api/prob/[id]/session
 * 문제집 세션 시작 또는 재개
 * 진행 중인 세션이 있으면 해당 세션의 저장된 답안과 함께 반환
 * 없으면 새 세션을 생성하여 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
    return nextFail(error);
  }
}

/**
 * DELETE /api/workbooks/[id]/session
 * 세션 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();
    await probService.deleteProbBookSession(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prob book session:", error);
    return nextFail(error);
  }
}
