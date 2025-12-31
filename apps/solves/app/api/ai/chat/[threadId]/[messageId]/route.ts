import { chatService } from "@service/solves";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string; messageId: string }> },
) {
  try {
    const { threadId, messageId } = await params;
    const { message } = await req.json();
    const session = await getSession();

    const isOwner = await chatService.hasThreadPermission(
      threadId,
      session.user.id,
    );

    if (!isOwner) {
      return nextFail("권한이 없습니다.");
    }
    await chatService.upsertMessage({
      ...message,
      threadId,
      id: messageId,
    });

    return nextOk();
  } catch (error) {
    logger.error("Error fetching workbook chat messages:", error);
    return nextFail(error);
  }
}
