import { chatService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const threads = await chatService.selectThreadsByWorkbookId({
      workbookId: id,
      userId: session.user.id,
    });

    return nextOk(threads);
  } catch (error) {
    logger.error("Error fetching threads:", error);
    return nextFail(error);
  }
}
