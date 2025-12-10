import { streamText } from "ai";
import { NextRequest } from "next/server";
import { getChatModel } from "@/lib/ai/model";
import { CompletionRequest } from "../../test/type";

export async function POST(request: NextRequest) {
  const { prompt, options } = await request
    .json()
    .then(CompletionRequest.parse);

  const result = streamText({
    model: getChatModel(options.model),
    prompt,
    system: options.systemPrompt ?? undefined,
    tools: options.tools ?? {},
  });
  return result.toTextStreamResponse();
}
