import { aiPriceService, categoryService, chatService } from "@service/solves";
import {
  AssistantMessageMetadata,
  BlockType,
  ChatMetadata,
  calculateCost,
} from "@service/solves/shared";
import { PublicError } from "@workspace/error";
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
import { generateWorkbookMetaTool } from "@/lib/ai/tools/workbook/generate-workbook-meta-tools";
import {
  READ_BLOCK_TOOL_NAME,
  readBlockTool,
} from "@/lib/ai/tools/workbook/read-block-tool";
import { WORKBOOK_META_TOOL_NAME } from "@/lib/ai/tools/workbook/shared";
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
    title,
    description,
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
    userName: session.user.nickname || session.user.name,
    title: title ?? "",
    description: description ?? "",
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

      const tools = {
        ...loadGenerateBlockTools(blockTypes as BlockType[]),
        [EXA_SEARCH_TOOL_NAME]: exaSearchTool,
        [WORKBOOK_META_TOOL_NAME]: generateWorkbookMetaTool,
      };
      // 생성한 문제집이있는지
      const hasBlocks = serializeBlocks?.length;
      if (hasBlocks) {
        tools[READ_BLOCK_TOOL_NAME] = readBlockTool;
      }

      const result = streamText({
        model: getChatModel(model),
        messages: convertToModelMessages(messages),
        system: systemPrompt,
        experimental_transform: smoothStream({ chunking: "word" }),
        maxRetries: 1,
        stopWhen: stepCountIs(5),
        abortSignal: req.signal,
        tools,
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
      } else if (responseMessage.parts.length) {
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
      } else {
        throw new PublicError("채팅에 문제가 발생했습니다. 다시 시도해주세요.");
      }
    },
    originalMessages: messages,
    onError: (error) => {
      // @TODO error 로그 저장해서 원인 분석해야함
      logger.error({ error });
      throw error;
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
}
