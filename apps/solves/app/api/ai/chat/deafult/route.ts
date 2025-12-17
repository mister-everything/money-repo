import { convertToModelMessages, streamText } from "ai";
import { getChatModel } from "@/lib/ai/model";
import { DefaultChatRequest } from "../../util";

export const maxDuration = 300;
// Example
export async function POST(req: Request) {
  const { messages, model } = await req.json().then(DefaultChatRequest.parse);

  const result = streamText({
    model: getChatModel(model),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
