import { probService } from "@service/solves";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const { id: probBookId } = await params;

  try {
    const result = await probService.getLatestProbBookResult(
      probBookId,
      session.user.id,
    );

    if (!result) {
      return NextResponse.json({ success: false, error: "Result not found" });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching result:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
