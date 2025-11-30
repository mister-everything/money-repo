"use server";

import { chatService } from "@service/solves";
import { UIMessage } from "ai";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { nextFail, nextOk } from "@/lib/protocol/next-route-helper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workbookId: string; threadId: string }> },
) {
  try {
    const { workbookId, threadId } = await params;
    const session = await getSession();

    const threads = await chatService.selectThreadsByWorkbookId({
      workbookId,
      userId: session.user.id,
    });

    const hasAccess = threads.some((thread) => thread.id === threadId);
    if (!hasAccess) {
      return nextFail("Thread not found", 404);
    }

    const messages = await chatService.selectMessages(threadId);
    const uiMessages: UIMessage[] = messages.map((message) => ({
      id: message.id,
      role: message.role,
      parts: message.parts,
      createdAt: message.createdAt,
    }));

    return nextOk(uiMessages);
  } catch (error) {
    logger.error("Error fetching workbook chat messages:", error);
    return nextFail(error);
  }
}
