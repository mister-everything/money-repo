import { LanguageModelV2StreamPart } from "@ai-sdk/provider";
import { randomRange } from "@workspace/util";
import { createIdGenerator } from "ai";

const genId = createIdGenerator({
  prefix: "solves",
});

export const generateSimulateStreamPart = (
  message: string,
): LanguageModelV2StreamPart[] => {
  const id = genId();
  let originalMessage = message;

  const startPart: LanguageModelV2StreamPart = {
    type: "text-start",
    id,
  };
  const endPart: LanguageModelV2StreamPart = {
    type: "text-end",
    id,
  };
  const deltaParts: LanguageModelV2StreamPart[] = [];
  while (originalMessage.length > 0) {
    const random = randomRange(1, 3);
    const chunk = originalMessage.slice(0, random);
    originalMessage = originalMessage.slice(random);
    deltaParts.push({
      type: "text-delta",
      id,
      delta: chunk,
    });
  }

  return [startPart, ...deltaParts, endPart];
};
