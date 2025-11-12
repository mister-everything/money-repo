import { probService } from "@service/solves";
import { SubmitProbBookResponse } from "@service/solves/shared";
import { NextRequest, NextResponse } from "next/server";
import { ErrorResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/prob/[id]/submit
 * 특정 문제집 제출 결과 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const probBook = await probService.selectProbBookById(id);

    if (!probBook) {
      return NextResponse.json(errorResponse("문제집을 찾을 수 없습니다."), {
        status: 404,
      });
    }

    return NextResponse.json(probBook);
  } catch (error) {
    console.error("Error fetching prob book:", error);
    return NextResponse.json(
      errorResponse("문제집 조회 중 오류가 발생했습니다."),
      {
        status: 500,
      },
    );
  }
}

/**
 * POST /api/prob/[id]/submit
 * 특정 문제집 제출
 * submitId가 있으면 세션 기반 제출, 없으면 기존 방식 (하위 호환성)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<
  NextResponse<
    | {
        success: true;
        data: SubmitProbBookResponse;
      }
    | ErrorResponse
  >
> {
  try {
    const { id } = params;
    const { answer, submitId } = await request.json();

    let result;

    if (submitId) {
      // 세션 기반 제출
      result = await probService.submitProbBookSession(submitId, id, answer);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error submitting prob book:", error);
    return NextResponse.json(
      errorResponse("문제집 제출 중 오류가 발생했습니다."),
      {
        status: 500,
      },
    );
  }
}
