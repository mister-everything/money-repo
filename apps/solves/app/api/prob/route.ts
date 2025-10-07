import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probBookSaveSchema, probService } from "@service/solves";

/**
 * GET /api/prob
 * 문제집 목록 조회
 * - Query Params:
 *   - ownerId (선택, 특정 사용자의 문제집만 조회)
 *   - public (선택, 공개된 문제집만 조회)
 */
export async function GET(request: NextRequest) {
  try {
    console.log(
      "🔗 POSTGRES_URL:",
      process.env.POSTGRES_URL ? "설정됨" : "없음",
    );

    const searchParams = request.nextUrl.searchParams;
    const ownerId = searchParams.get("ownerId");
    const publicOnly = searchParams.get("public") === "true";

    let probBooks;
    if (ownerId) {
      probBooks = await probService.findByOwnerId(ownerId);
    } else if (publicOnly) {
      probBooks = await probService.findPublic();
    } else {
      probBooks = await probService.findAll();
    }

    return NextResponse.json({
      success: true,
      data: probBooks,
      count: probBooks.length,
    });
  } catch (error) {
    console.error("Error fetching prob books:", error);
    return NextResponse.json(
      {
        success: false,
        error: "문제집 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/prob
 * 새 문제집 생성 또는 수정
 * Body: ProbBook 데이터
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 데이터 검증
    const validatedData = probBookSaveSchema.parse(body);

    const savedProbBook = await probService.save(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: savedProbBook,
        message: validatedData.id
          ? "문제집이 성공적으로 수정되었습니다."
          : "문제집이 성공적으로 생성되었습니다.",
      },
      { status: validatedData.id ? 200 : 201 },
    );
  } catch (error) {
    console.error("Error saving prob book:", error);

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
        error: "문제집 저장 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
