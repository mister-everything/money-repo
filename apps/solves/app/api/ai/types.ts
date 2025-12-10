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
    workbookId: z.string(),
  }).shape,
);

export const Options = z.object({
  // 모델 정보
  model: z.object({
    provider: z.string(),
    model: z.string(),
  }),
  // 도구 정보
  tools: z.array(z.string()).optional(),
  // 시스템 프롬프트
  systemPrompt: z.string().optional(),
});

export const CompletionRequest = z.object({
  prompt: z.string(),
  options: Options,
});

export const ChatRequest = z.object({
  messages: z.array(z.any()),
  options: Options,
});

export type ChatRequest = z.infer<typeof ChatRequest>;
export type CompletionRequest = z.infer<typeof CompletionRequest>;
export type Options = z.infer<typeof Options>;
