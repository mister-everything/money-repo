import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probService } from "@service/solves";

/**
 * POST /api/prob/submit
 * 문제집 제출 세션 시작
 * Body: { probBookId: number, ownerId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { probBookId, ownerId } = z
      .object({
        probBookId: z.number(),
        ownerId: z.string(),
      })
      .parse(body);

    const session = await probService.startSubmitSession(probBookId, ownerId);

    return NextResponse.json(
      {
        success: true,
        data: session,
        message: "문제집 풀이 세션이 시작되었습니다.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error starting submit session:", error);

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
        error: "문제집 풀이 세션 시작 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/prob/submit
 * 제출 이력 조회
 * Query Params: ownerId (필수), probBookId (선택)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get("ownerId");
    const probBookIdParam = searchParams.get("probBookId");

    if (!ownerId) {
      return NextResponse.json(
        {
          success: false,
          error: "사용자 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    let probBookId: number | undefined;
    if (probBookIdParam) {
      probBookId = parseInt(probBookIdParam, 10);
      if (isNaN(probBookId)) {
        return NextResponse.json(
          {
            success: false,
            error: "올바른 문제집 ID를 입력해주세요.",
          },
          { status: 400 },
        );
      }
    }

    const history = await probService.getSubmitHistory(ownerId, probBookId);

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error("Error fetching submit history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "제출 이력 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
