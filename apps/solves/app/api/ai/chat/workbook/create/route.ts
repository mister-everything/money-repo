import { chatService } from "@service/solves";
import { generateUUID } from "@workspace/util";
import { convertToModelMessages, streamText } from "ai";
import { getChatModel } from "@/lib/ai/model";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { WorkbookCreateChatRequest } from "../../../types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, model, threadId, workbookId } = await req
    .json()
    .then(WorkbookCreateChatRequest.parse);

  const session = await getSession();

  const thread = await chatService.createThreadIfNotExists({
    threadId,
    userId: session.user.id,
    title: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  });
  if (thread.isNew) {
    await chatService.linkThreadToWorkbook({
      workbookId,
      threadId,
      userId: session.user.id,
    });
  }

  const userMessage = messages.at(-1);

  const assistantMessageId = generateUUID();

  const result = streamText({
    model: getChatModel(model),
    messages: convertToModelMessages(messages),
    onFinish: async (ctx) => {
      await chatService.upsertMessage({
        id: userMessage.id,
        threadId,
        role: "user",
        parts: userMessage.parts,
      });
      await chatService.upsertMessage({
        id: assistantMessageId,
        threadId,
        role: "assistant",
        parts: [{ type: "text", text: ctx.text }],
      });

      logger.info("Chat finished", ctx.text);
    },
    onError: (error) => {
      logger.error("Chat error", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
