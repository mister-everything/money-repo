"use server";

import { chatService } from "@service/solves";
import { PublicError } from "@workspace/error";
import { UIMessage } from "ai";
import { uiPartToSavePart } from "@/app/api/ai/shared";
import { getSession } from "@/lib/auth/server";
import { ok } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

export const deleteThreadAction = safeAction(async (threadId: string) => {
  const session = await getSession();

  const isOwner = await chatService.hasThreadPermission(
    threadId,
    session.user.id,
  );
  if (!isOwner) {
    throw new PublicError("권한이 없습니다.");
  }
  await chatService.deleteThread(threadId);
  return ok();
});

export const updateMessageAction = safeAction(
  async ({
    threadId,
    messageId,
    message,
  }: {
    threadId: string;
    messageId: string;
    message: UIMessage;
  }) => {
    const session = await getSession();
    const isOwner = await chatService.hasThreadPermission(
      threadId,
      session.user.id,
    );
    if (!isOwner) {
      throw new PublicError("권한이 없습니다.");
    }
    await chatService.upsertMessage({
      parts: message.parts.map(uiPartToSavePart),
      role: message.role,
      threadId,
      id: messageId,
    });
    return ok();
  },
);
