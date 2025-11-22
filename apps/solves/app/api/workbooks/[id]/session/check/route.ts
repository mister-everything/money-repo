import { probService } from "@service/solves";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail } from "@/lib/protocol/next-route-helper";

/**
 * GET /api/prob/[id]/session/check
 * 문제집 세션 존재 여부 확인
 * 진행 중인 세션이 있으면 true를 반환
 * 없으면 false를 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const hasSession = await probService.hasProbBookSession(
      id,
      session.user.id,
    );

    return NextResponse.json({
      success: true,
      data: hasSession,
    });
  } catch (error) {
    console.error("Error starting/resuming prob book session:", error);
    return nextFail(error);
  }
}
