import { workBookService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";
import { log } from "@/lib/logger";

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
    await workBookService.deleteWorkBookSession(submitId, session.user.id);
    return nextOk({ success: true });
  } catch (error) {
    log.error("Error deleting prob book session:", error);
    return nextFail(error);
  }
}
