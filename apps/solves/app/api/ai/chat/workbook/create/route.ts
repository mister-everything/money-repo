import { categoryService, chatService } from "@service/solves";
import { BlockType } from "@service/solves/shared";
import { generateUUID, isNull } from "@workspace/util";
import { IS_PROD } from "@workspace/util/const";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { getChatModel } from "@/lib/ai/model";
import { WorkBookCreatePrompt } from "@/lib/ai/prompt";
import { EXA_SEARCH_TOOL_NAME } from "@/lib/ai/tools/web-search/types";
import { exaSearchTool } from "@/lib/ai/tools/web-search/web-search-tool";
import { loadGenerateBlockTools } from "@/lib/ai/tools/workbook/generate-block-tools";
import { getSession } from "@/lib/auth/server";
import { logger } from "@/lib/logger";
import { WorkbookCreateChatRequest } from "../../../types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const {
    messages,
    model,
    threadId,
    workbookId,
    blockTypes,
    situation,
    normalizeBlock,
    category: categoryId,
  } = await req.json().then(WorkbookCreateChatRequest.parse);

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

  const category = isNull(categoryId)
    ? undefined
    : await categoryService.getById(categoryId);

  const systemPrompt = WorkBookCreatePrompt({
    category: category ?? undefined,
    blockTypes,
    situation: situation ?? "",
    normalizeBlock,
  });

  if (!IS_PROD) logger.debug(systemPrompt);

  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: getChatModel(model),
        messages: convertToModelMessages(messages),
        system: systemPrompt,
        experimental_transform: smoothStream({ chunking: "word" }),
        maxRetries: 1,
        stopWhen: stepCountIs(5),
        abortSignal: req.signal,
        tools: {
          ...loadGenerateBlockTools(blockTypes as BlockType[]),
          [EXA_SEARCH_TOOL_NAME]: exaSearchTool,
        },
      });
      result.consumeStream();
      dataStream.merge(result.toUIMessageStream());
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
