import { aiPriceService, categoryService, chatService } from "@service/solves";
import {
  AssistantMessageMetadata,
  BlockType,
  ChatMetadata,
  calculateCost,
} from "@service/solves/shared";
import { generateUUID, isNull } from "@workspace/util";
import { IS_PROD } from "@workspace/util/const";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  stepCountIs,
  streamText,
  UIMessage,
} from "ai";
import { getChatModel } from "@/lib/ai/model";
import { WorkBookCreatePrompt } from "@/lib/ai/prompt";
import { getTokens } from "@/lib/ai/shared";
import { EXA_SEARCH_TOOL_NAME } from "@/lib/ai/tools/web-search/types";
import { exaSearchTool } from "@/lib/ai/tools/web-search/web-search-tool";
import { loadGenerateBlockTools } from "@/lib/ai/tools/workbook/generate-block-tools";
import {
  READ_BLOCK_TOOL_NAME,
  readBlockTool,
} from "@/lib/ai/tools/workbook/read-block-tool";
import { getSession } from "@/lib/auth/server";
import { createLogger } from "@/lib/logger";
import {
  extractInProgressToolPart,
  uiPartToSavePart,
  WorkbookCreateChatRequest,
} from "../../../shared";

export const maxDuration = 300;

const logger = createLogger("workbook-create-chat", "bgBlue");

export async function POST(req: Request) {
  const {
    messages,
    model,
    threadId,
    workbookId,
    blockTypes,
    situation,
    ageGroup,
    serializeBlocks,
    category: categoryId,
  } = await req.json().then(WorkbookCreateChatRequest.parse);

  const session = await getSession();

  const thread = await chatService.createWorkBookThreadIfNotExists({
    threadId,
    workbookId,
    userId: session.user.id,
    title: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  });

  const lastMessage = messages.at(-1)!;

  const category = isNull(categoryId)
    ? undefined
    : await categoryService.getById(categoryId);

  const systemPrompt = WorkBookCreatePrompt({
    category: category ?? undefined,
    blockTypes,
    situation: situation ?? "",
    ageGroup: ageGroup ?? "",
    userName: session.user.name,
    serializeBlocks,
  });
  logger.debug(`model: ${model.provider}/${model.model}`);

  if (!IS_PROD) logger.debug(systemPrompt);

  const price = await aiPriceService.getActivePriceByProviderAndModelName(
    model.provider,
    model.model,
  );

  const stream = createUIMessageStream<UIMessage>({
    execute: async ({ writer: dataStream }) => {
      const inProgressToolParts = extractInProgressToolPart(lastMessage);
      logger.info({ inProgressToolParts });
      if (inProgressToolParts.length) {
        await Promise.all(
          inProgressToolParts.map(async (part) => {
            const output = "사용자가 도구 사용을 cancel 하였습니다.";
            part.output = output;
            dataStream.write({
              type: "tool-output-available",
              toolCallId: part.toolCallId,
              output,
            });
          }),
        );
      }

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
          ...(!serializeBlocks?.length
            ? {}
            : { [READ_BLOCK_TOOL_NAME]: readBlockTool }),
        },
      });

      result.consumeStream();
      dataStream.merge(
        result.toUIMessageStream({
          messageMetadata: ({ part }) => {
            if (part.type == "finish" && price) {
              const { inputTokens, outputTokens } = getTokens(part.totalUsage);
              const metadata: AssistantMessageMetadata = {
                input: inputTokens,
                output: outputTokens,
                provider: model.provider,
                model: model.model,
                cost: Number(
                  calculateCost(price!, {
                    input: inputTokens,
                    output: outputTokens,
                  }).totalMarketCost.toFixed(6),
                ),
              };
              return metadata;
            }
          },
        }),
      );
    },
    generateId: generateUUID,
    onFinish: async ({ responseMessage }) => {
      if (responseMessage.id == lastMessage.id) {
        await chatService.upsertMessage({
          id: responseMessage.id,
          threadId: thread.id,
          role: responseMessage.role,
          parts: responseMessage.parts.map(uiPartToSavePart),
          metadata: responseMessage.metadata as ChatMetadata,
        });
      } else {
        await chatService.upsertMessage(
          {
            id: lastMessage.id,
            threadId: thread.id,
            role: lastMessage.role,
            parts: lastMessage.parts.map(uiPartToSavePart),
            metadata: lastMessage.metadata as ChatMetadata,
          },
          {
            id: responseMessage.id,
            threadId: thread.id,
            role: responseMessage.role,
            parts: responseMessage.parts.map(uiPartToSavePart),
            metadata: responseMessage.metadata as ChatMetadata,
          },
        );
      }
    },
    originalMessages: messages,
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
