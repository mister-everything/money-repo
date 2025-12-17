import type { WorkBookBlock } from "@service/solves/shared";
import { truncateString } from "@workspace/util";
import { SolvesMentionItem } from "./types";

export const toBlockMention = (
  block: WorkBookBlock,
): Extract<SolvesMentionItem, { kind: "block" }> => {
  return {
    kind: "block",
    id: block.id,
    order: block.order,
    question: truncateString(block.question?.trim() ?? "", 14),
    blockType: block.type,
  };
};

export const serializeMention = (mention: SolvesMentionItem): string => {
  const json = JSON.stringify(mention);
  return `mention:[${json}]`;
};

// Support both legacy "@mention:[...]" and current "mention:[...]" formats.
const MENTION_REGEX = /@?mention:\[([\s\S]*?)\]/g;

export function normalizeMentions(
  input: string,
): Array<string | SolvesMentionItem> {
  const result: Array<string | SolvesMentionItem> = [];

  let lastIndex = 0;

  for (const match of input.matchAll(MENTION_REGEX)) {
    const [raw, json] = match;
    const index = match.index ?? 0;

    // 앞부분 일반 텍스트
    if (index > lastIndex) {
      result.push(input.slice(lastIndex, index));
    }

    try {
      const parsed = JSON.parse(json);

      if (parsed?.kind) {
        result.push(parsed as SolvesMentionItem);
      } else {
        result.push(raw);
      }
    } catch {
      // JSON 깨졌으면 그냥 텍스트
      result.push(raw);
    }

    lastIndex = index + raw.length;
  }

  // 마지막 남은 텍스트
  if (lastIndex < input.length) {
    result.push(input.slice(lastIndex));
  }

  return result;
}
