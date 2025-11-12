import z from "zod";

export const DefaultChatRequest = z.object({
  messages: z.array(z.any()),
  model: z.object({
    provider: z.string(),
    model: z.string(),
  }),
});
