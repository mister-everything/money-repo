import { commentService } from "@service/solves";
import { NextRequest } from "next/server";
import { safeGetSession } from "@/lib/auth/server";
import { nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : undefined;
  const session = await safeGetSession();
  const comments = await commentService.getCommentsByWorkbookIdV1(id, {
    userId: session?.user.id,
    cursor,
    limit,
  });

  return nextOk(comments);
}
