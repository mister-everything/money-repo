import { NextRequest, NextResponse } from "next/server";
import "@workspace/env";
import { probService } from "@service/solves";

/**
 * GET /api/prob/session/ongoing
 * 진행 중인 세션 조회
 * Query Params: probBookId (필수), ownerId (필수)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const probBookIdParam = searchParams.get("probBookId");
    const ownerId = searchParams.get("ownerId");

    if (!probBookIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "문제집 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    const probBookId = parseInt(probBookIdParam, 10);
    if (isNaN(probBookId)) {
      return NextResponse.json(
        {
          success: false,
          error: "올바른 문제집 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const ongoingSession = await probService.getOngoingSession(
      probBookId,
      ownerId,
    );

    return NextResponse.json({
      success: true,
      data: ongoingSession, // null이면 진행 중인 세션 없음
      hasOngoing: !!ongoingSession,
    });
  } catch (error) {
    console.error("Error fetching ongoing session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "진행 중인 세션 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
