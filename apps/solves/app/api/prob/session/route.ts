import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probService } from "@service/solves";

/**
 * PUT /api/prob/session
 * 문제집 제출 세션 완료
 * Body: { sessionId: number, score?: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { sessionId, score } = z
      .object({
        sessionId: z.number(),
        score: z.number().optional(),
      })
      .parse(body);

    const session = await probService.endSubmitSession(sessionId, score);

    return NextResponse.json({
      success: true,
      data: session,
      message: "문제집 풀이가 완료되었습니다.",
    });
  } catch (error) {
    console.error("Error ending submit session:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "입력 데이터가 올바르지 않습니다.",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "세션 완료 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/prob/session
 * 제출 세션 조회
 * Query Params: sessionId (필수)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionIdParam = searchParams.get("sessionId");

    if (!sessionIdParam) {
      return NextResponse.json(
        {
          success: false,
          error: "세션 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    const sessionId = parseInt(sessionIdParam, 10);
    if (isNaN(sessionId)) {
      return NextResponse.json(
        {
          success: false,
          error: "올바른 세션 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const session = await probService.getSubmitSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "세션을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      {
        success: false,
        error: "세션 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
