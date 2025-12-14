import { chatService } from "@service/solves";
import { generateUUID } from "@workspace/util";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { getChatModel } from "@/lib/ai/model";
import { generateMcqTool, generateSubjectiveTool } from "@/lib/ai/tools";
import { getSession } from "@/lib/auth/server";
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
  /***********************/
  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: getChatModel(model),
        messages: convertToModelMessages(messages),
        experimental_transform: smoothStream({ chunking: "word" }),
        maxRetries: 1,
        stopWhen: stepCountIs(5),

        abortSignal: req.signal,
        tools: {
          generateMcqTool,
          generateSubjectiveTool,
        },
      });
      result.consumeStream();
      dataStream.merge(
        result.toUIMessageStream({
          messageMetadata: ({ part }) => {},
        }),
      );
    },

    generateId: generateUUID,

    onFinish: async ({ responseMessage }) => {
      await chatService.upsertMessage({
        id: userMessage.id,
        threadId,
        role: userMessage.role,
        parts: userMessage.parts,
        metadata: userMessage.metadata,
      });
      ``;
      await chatService.upsertMessage({
        id: assistantMessageId,
        threadId,
        role: responseMessage.role,
        parts: responseMessage.parts,
        metadata: responseMessage.metadata,
      });
    },
    originalMessages: messages,
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
