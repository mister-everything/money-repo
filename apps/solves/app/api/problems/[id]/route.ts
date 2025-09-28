import { NextResponse } from "next/server";
import { mockProbBooks } from "@/lib/problem/mock-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const allProblems = mockProbBooks.flatMap((b) => b.blocks);
    const problem = allProblems.find((p) => p.id === id);
    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Not Found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, data: problem });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
