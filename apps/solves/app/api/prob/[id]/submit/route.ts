import { probService } from "@service/solves";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { ErrorResponse, errorResponse } from "@/lib/response";

/**
 * GET /api/prob/[id]/submit
 * 특정 문제집 제출 결과 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<
  NextResponse<
    | {
        success: true;
        data: {
          score: number;
        };
      }
    | ErrorResponse
  >
> {
  try {
    const { id } = await params;
    const { answer } = await request.json();

    const session = await getSession();
    const { score } = await probService.submitProbBook(
      id,
      answer,
      session.user.id,
    );
    return NextResponse.json({
      success: true,
      data: {
        score,
      },
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
