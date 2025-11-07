import { convertToModelMessages, streamText } from "ai";
import { DefaultChatRequest } from "../types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, model } = await req.json().then(DefaultChatRequest.parse);

  const result = streamText({
    model: `${model.provider}/${model.model}`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
