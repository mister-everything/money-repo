import { probService } from "@service/solves";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail } from "@/lib/protocol/next-route-helper";

/**
 * DELETE /api/workbooks/[id]/session/[submitId]
 * 세션 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ submitId: string }> },
) {
  try {
    const { submitId } = await params;
    const session = await getSession();
    await probService.deleteProbBookSession(submitId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prob book session:", error);
    return nextFail(error);
  }
}
