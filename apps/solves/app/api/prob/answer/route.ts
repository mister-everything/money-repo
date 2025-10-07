import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import "@workspace/env";
import { probBlockAnswerSubmitApiSchema, probService } from "@service/solves";

/**
 * POST /api/prob/answer
 * 문제 답안 제출
 * Body: { blockId: number, sessionId: number, answer: ProbBlockAnswerSubmit }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { blockId, sessionId, answer } = z
      .object({
        blockId: z.number(),
        sessionId: z.number(),
        answer: probBlockAnswerSubmitApiSchema,
      })
      .parse(body);

    const isCorrect = await probService.submitAnswer(
      blockId,
      sessionId,
      answer,
    );

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        blockId,
        sessionId,
      },
      message: isCorrect ? "정답입니다!" : "틀렸습니다.",
    });
  } catch (error) {
    console.error("Error submitting answer:", error);

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
        error: "답안 제출 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
