import { UIMessage } from "@ai-sdk/react";
import { SystemPrompt } from "@service/solves/shared";
import { exclude } from "@workspace/util";
import { UIMessagePart } from "ai";
import z from "zod";

export const DefaultChatRequest = z.object({
  messages: z.array(z.any()),
  model: z.object({
    provider: z.string(),
    model: z.string(),
  }),
});

export const WorkbookCreateChatRequest = DefaultChatRequest.extend(
  z.object({
    threadId: z.string(),
    title: z.string().nullish(),
    description: z.string().nullish(),
    workbookId: z.string(),
    situation: z.string().optional(),
    blockTypes: z.array(z.string()).optional(),
    normalizeBlocks: z.array(z.string()).optional(),
    category: z.number().nullish(),
  }).shape,
);

export const uiMessageToSaveMessage = (uiMessage: UIMessage): UIMessage => {
  return {
    ...uiMessage,
    parts: uiMessage.parts.map(
      (part) =>
        exclude(part as any, [
          "providerMetadata",
          "callProviderMetadata",
        ]) as UIMessagePart<any, any>,
    ),
  };
};

export const Options = z.object({
  // 모델 정보
  model: z.object({
    provider: z.string(),
    model: z.string(),
  }),
  // 도구 정보
  tools: z.array(z.string()).optional(),
  // 시스템 프롬프트
  systemPrompt: z.enum(SystemPrompt).optional(),
});

export const CompletionRequest = z.object({
  prompt: z.string(),
  options: Options,
});

export const ExplainSolutionRequest = z.object({
  block: z.object({
    id: z.string().optional(),
    type: z.string(),
    question: z.string(),
    content: z.any(),
    answer: z.any(),
  }),
  options: Options,
});

export const ChatRequest = z.object({
  messages: z.array(z.any()),
  options: Options,
});

export type ChatRequest = z.infer<typeof ChatRequest>;
export type CompletionRequest = z.infer<typeof CompletionRequest>;
export type ExplainSolutionRequest = z.infer<typeof ExplainSolutionRequest>;
export type Options = z.infer<typeof Options>;
