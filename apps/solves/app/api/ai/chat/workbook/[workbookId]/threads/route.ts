import { chatService } from "@service/solves";
import { getSession } from "@/lib/auth/server";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

/**
 * GET /api/ai/chat/workbook/[workbookId]/threads
 * workbookId로 연결된 thread 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workbookId: string }> },
) {
  try {
    const { workbookId } = await params;
    const session = await getSession();

    const threads = await chatService.selectThreadsByWorkbookId({
      workbookId,
      userId: session.user.id,
    });

    return nextOk(threads);
  } catch (error) {
    logger.error("Error fetching threads:", error);
    return nextFail(error);
  }
}

