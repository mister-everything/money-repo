import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probBlockUpdateSchema, probService } from "@service/solves";

/**
 * GET /api/prob/block/[id]
 * 특정 문제 블록 조회
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
          error: "올바른 문제 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const block = await probService.getBlockById(id);

    if (!block) {
      return NextResponse.json(
        {
          success: false,
          error: "문제를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: block,
    });
  } catch (error) {
    console.error("Error fetching prob block:", error);
    return NextResponse.json(
      {
        success: false,
        error: "문제 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/prob/block/[id]
 * 특정 문제 블록 수정
 * Body: { type?, question?, content?, answer?, order? }
 */
export async function PUT(
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
          error: "올바른 문제 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    // 입력 데이터 검증
    const validatedData = probBlockUpdateSchema.parse(body);

    // 문제가 존재하는지 확인
    const existingBlock = await probService.getBlockById(id);
    if (!existingBlock) {
      return NextResponse.json(
        {
          success: false,
          error: "문제를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    const updatedBlock = await probService.updateBlock(id, validatedData);

    return NextResponse.json({
      success: true,
      data: updatedBlock,
      message: "문제가 성공적으로 수정되었습니다.",
    });
  } catch (error) {
    console.error("Error updating prob block:", error);

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
        error: "문제 수정 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/prob/block/[id]
 * 특정 문제 블록 삭제
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
          error: "올바른 문제 ID를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    // 문제가 존재하는지 확인
    const block = await probService.getBlockById(id);
    if (!block) {
      return NextResponse.json(
        {
          success: false,
          error: "문제를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    await probService.deleteBlock(id);

    return NextResponse.json({
      success: true,
      message: "문제가 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting prob block:", error);
    return NextResponse.json(
      {
        success: false,
        error: "문제 삭제 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
