import { probService } from "@service/solves";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { errorResponse } from "@/lib/response";

/**
 * POST /api/prob/[id]/save
 * 답안 자동 저장 (30초 주기)
 * 변경된 답안만 DB에 저장 (upsert)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { submitId, answers } = await request.json();

    await getSession(); // 인증 확인

    if (!submitId) {
      return NextResponse.json(errorResponse("세션 ID가 필요합니다."), {
        status: 400,
      });
    }

    await probService.saveAnswerProgress(submitId, answers);

    return NextResponse.json({
      success: true,
      data: { saved: true },
    });
  } catch (error) {
    console.error("Error saving answer progress:", error);
    return NextResponse.json(
      errorResponse("답안 저장 중 오류가 발생했습니다."),
      { status: 500 },
    );
  }
}
