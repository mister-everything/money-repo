import { convertToModelMessages, streamText } from "ai";
import { getChatModel } from "@/lib/ai/model";
import { WorkbookCreateChatRequest } from "../../../types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, model } = await req
    .json()
    .then(WorkbookCreateChatRequest.parse);

  const result = streamText({
    model: getChatModel(model),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
