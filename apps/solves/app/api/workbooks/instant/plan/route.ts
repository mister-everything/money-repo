import { streamText } from "ai";
import { getDefaultChatModel } from "@/lib/ai/model";

/**
 * @TODO plan action 말고 route 로 구현~~~ 해서 streaming 하기 .
 * @author 최성근
 */

export async function POST(req: Request) {
  const stream = await streamText({
    model: await getDefaultChatModel(),
    messages: [],
    system: "",
  });

  return stream.toUIMessageStreamResponse();
}
