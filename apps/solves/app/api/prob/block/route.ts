import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probBlockCreateSchema, probService } from "@service/solves";

/**
 * POST /api/prob/block
 * 새 문제 블록 생성
 * Body: { probBookId, type, question?, content, answer?, order? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력 데이터 검증
    const validatedData = probBlockCreateSchema.parse(body);

    const newBlock = await probService.createBlock(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: newBlock,
        message: "문제가 성공적으로 생성되었습니다.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating prob block:", error);

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
        error: "문제 생성 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
