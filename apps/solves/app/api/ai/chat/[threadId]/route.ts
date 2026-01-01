import { chatService } from "@service/solves";
import { UIMessage } from "ai";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  try {
    const { threadId } = await params;
    const session = await getSession();

    const isOwner = await chatService.hasThreadPermission(
      threadId,
      session.user.id,
    );

    if (!isOwner) {
      return nextFail("권한이 없습니다.");
    }

    const messages = await chatService.selectMessages(threadId);
    const uiMessages: UIMessage[] = messages.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts,
      createdAt: message.createdAt,
      metadata: message.metadata,
    }));

    return nextOk(uiMessages);
  } catch (error) {
    logger.error("Error fetching workbook chat messages:", error);
    return nextFail(error);
  }
}
