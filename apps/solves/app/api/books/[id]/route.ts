import { NextResponse } from "next/server";
import { mockProbBooks } from "@/lib/problem/mock-data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const book = mockProbBooks.find((b) => b.id === params.id);
    if (!book) {
      return NextResponse.json(
        { success: false, error: "Not Found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...book,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
