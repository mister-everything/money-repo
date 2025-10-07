import { NextRequest, NextResponse } from "next/server";
import "@workspace/env";
import { probService } from "@service/solves";

/**
 * GET /api/prob/[id]
 * 특정 문제집 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "올바른 문제집 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const probBook = await probService.findById(id);

    if (!probBook) {
      return NextResponse.json(
        {
          success: false,
          error: "문제집을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: probBook,
    });
  } catch (error) {
    console.error("Error fetching prob book:", error);
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
 * DELETE /api/prob/[id]
 * 특정 문제집 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "올바른 문제집 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    // 문제집이 존재하는지 확인
    const probBook = await probService.findById(id);
    if (!probBook) {
      return NextResponse.json(
        {
          success: false,
          error: "문제집을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    await probService.delete(id);

    return NextResponse.json({
      success: true,
      message: "문제집이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting prob book:", error);
    return NextResponse.json(
      {
        success: false,
        error: "문제집 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
