import { NextResponse } from "next/server";
import { mockProbBooks } from "@/lib/problem/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "20");
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const tag = searchParams.getAll("tag");

    let list = mockProbBooks;

    if (q) {
      list = list.filter((b) =>
        [b.title, b.description ?? ""].some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (tag.length > 0) {
      list = list.filter((b) => tag.every((t) => b.tags?.includes(t)));
    }

    const total = list.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageItems = list.slice(start, end).map((b) => ({
      ...b,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: pageItems,
      total,
      page,
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
