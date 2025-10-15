import { probService } from "@service/solves";
import { createProbBookSchema } from "@service/solves/shared";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/response";

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

    const probBooks = await probService.searchProbBooks();

    return NextResponse.json(probBooks);
  } catch (error) {
    console.error("Error fetching prob books:", error);
    return NextResponse.json(
      errorResponse("문제집 조회 중 오류가 발생했습니다."),
      {
        status: 500,
      },
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
    const validatedData = createProbBookSchema.parse(body);

    const savedProbBook = await probService.createProbBook(validatedData);

    return NextResponse.json(savedProbBook);
  } catch (error) {
    console.error("Error saving prob book:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse("입력 데이터가 올바르지 않습니다."),
        {
          status: 400,
        },
      );
    }

    return NextResponse.json(
      errorResponse("문제집 생성 중 오류가 발생했습니다."),
      {
        status: 500,
      },
    );
  }
}
