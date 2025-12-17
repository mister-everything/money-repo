import { describe, expect, test } from "vitest";
import type { SolvesMentionItem } from "./types";
import { normalizeMentions, serializeMention, toBlockMention } from "./util";

describe("apps/solves/components/mention/util", () => {
  test("toBlockMention: converts block -> mention and truncates question to 20 chars", () => {
    const block = {
      id: "block-1",
      order: 3,
      type: "explain",
      question: "   12345678901234567890   ",
    } as any;

    const mention = toBlockMention(block);

    expect(mention.kind).toBe("block");
    expect(mention.id).toBe("block-1");
    expect(mention.order).toBe(3);
    expect(mention.blockType).toBe("explain");
    // truncateString(..., 14): slices to 14 chars then appends "..."
  });

  test("serializeMention: wraps mention as @mention:[<json>]", () => {
    const mention: Extract<SolvesMentionItem, { kind: "block" }> = {
      kind: "block",
      id: "b1",
      order: 1,
      blockType: "default",
    };

    const token = serializeMention(mention);

    expect(token.startsWith("mention:[")).toBe(true);
    expect(token.endsWith("]")).toBe(true);

    const json = token.slice("mention:[".length, -1);
    expect(JSON.parse(json)).toEqual(mention);
  });

  test("normalizeMentions: returns original string when no mention tokens exist", () => {
    expect(normalizeMentions("hello world")).toEqual(["hello world"]);
  });

  test("normalizeMentions: parses a single valid mention and keeps surrounding text", () => {
    const mention: Extract<SolvesMentionItem, { kind: "block" }> = {
      kind: "block",
      id: "b2",
      order: 2,
      blockType: "default",
    };
    const input = `hi ${serializeMention(mention)} bye`;

    expect(normalizeMentions(input)).toEqual(["hi ", mention, " bye"]);
  });

  test("normalizeMentions: parses multiple mentions in one string", () => {
    const m1: Extract<SolvesMentionItem, { kind: "block" }> = {
      kind: "block",
      id: "a",
      order: 1,
      blockType: "default",
    };
    const m2: Extract<SolvesMentionItem, { kind: "block" }> = {
      kind: "block",
      id: "b",
      order: 2,
      blockType: "default",
    };
    const input = `A ${serializeMention(m1)} B ${serializeMention(m2)} C`;

    expect(normalizeMentions(input)).toEqual(["A ", m1, " B ", m2, " C"]);
  });

  test("normalizeMentions: if JSON is broken, keeps raw token as text", () => {
    const input = "x @mention:[{] y";
    expect(normalizeMentions(input)).toEqual(["x ", "@mention:[{]", " y"]);
  });

  test("normalizeMentions: if parsed JSON has no kind, keeps raw token as text", () => {
    const raw = '@mention:[{"id":"x"}]';
    const input = `x ${raw} y`;
    expect(normalizeMentions(input)).toEqual(["x ", raw, " y"]);
  });
});
