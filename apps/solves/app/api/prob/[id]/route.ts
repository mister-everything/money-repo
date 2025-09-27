import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probBookSaveSchema, probService } from "@service/prob";
// import { mockProbService as probService } from "../mock-service";

/**
 * GET /api/prob/[id]
 * 특정 문제집 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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
 * PUT /api/prob/[id]
 * 문제집 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 기존 문제집 존재 확인
    const existingProbBook = await probService.findById(id);
    if (!existingProbBook) {
      return NextResponse.json(
        {
          success: false,
          error: "수정할 문제집을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 입력 데이터 검증
    const validatedData = probBookSaveSchema.parse(body);

    // 업데이트 데이터 구성
    const probBookData = {
      ...validatedData,
      id: id, // URL의 ID 사용
      description: validatedData.description ?? null,
      updatedAt: new Date(),
      createdAt: existingProbBook.createdAt, // 기존 생성일 유지
    };

    const updatedProbBook = await probService.save(probBookData as any);

    return NextResponse.json({
      success: true,
      data: updatedProbBook,
      message: "문제집이 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("Error updating prob book:", error);

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
        error: "문제집 수정 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/prob/[id]
 * 문제집 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 기존 문제집 존재 확인
    const existingProbBook = await probService.findById(id);
    if (!existingProbBook) {
      return NextResponse.json(
        {
          success: false,
          error: "삭제할 문제집을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    await probService.deleteById(id);

    return NextResponse.json({
      success: true,
      message: "문제집이 성공적으로 삭제되었습니다.",
      data: { id },
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
