import { NextRequest, NextResponse } from "next/server";
import "@workspace/env";
import { probService } from "@service/solves";

/**
 * GET /api/prob/tags
 * 모든 태그 조회
 */
export async function GET(request: NextRequest) {
  try {
    const tags = await probService.getAllTags();

    return NextResponse.json({
      success: true,
      data: tags,
      count: tags.length,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      {
        success: false,
        error: "태그 조회 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
