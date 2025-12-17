import { describe, expect, it } from "vitest";
import { normalizeBlock } from "../normalize-block";
import { WorkBookBlock } from "../types";

describe("normalizeBlock", () => {
  describe("default block (주관식)", () => {
    const defaultBlock: WorkBookBlock<"default"> = {
      id: "test-default-id",
      type: "default",
      question: "한국의 수도는?",
      order: 1,
      content: { type: "default" },
      answer: {
        type: "default",
        answer: ["서울", "Seoul"],
        solution: "서울은 대한민국의 수도입니다.",
      },
    };

    it("should normalize default block correctly", () => {
      const result = JSON.parse(normalizeBlock(defaultBlock));

      expect(result.id).toBe("test-default-id");
      expect(result.type).toBe("default");
      expect(result.question).toBe("한국의 수도는?");
      expect(result.order).toBe(1);
      expect(result.content).toBeUndefined();
      expect(result.correctAnswer).toEqual(["서울", "Seoul"]);
      expect(result.solution).toBe("서울은 대한민국의 수도입니다.");
    });

    it("should return noAnswer message when answer is empty", () => {
      const blockWithoutAnswer: WorkBookBlock<"default"> = {
        ...defaultBlock,
        answer: { type: "default", answer: [] },
      };

      const result = JSON.parse(normalizeBlock(blockWithoutAnswer));
      expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
    });
  });

  describe("ox block (OX 퀴즈)", () => {
    const oxBlockTrue: WorkBookBlock<"ox"> = {
      id: "test-ox-id",
      type: "ox",
      question: "서울은 한국의 수도이다",
      order: 2,
      content: { type: "ox" },
      answer: { type: "ox", answer: true },
    };

    it("should normalize ox block with true answer", () => {
      const result = JSON.parse(normalizeBlock(oxBlockTrue));

      expect(result.type).toBe("ox");
      expect(result.correctAnswer).toBe("o");
    });

    it("should normalize ox block with false answer", () => {
      const oxBlockFalse: WorkBookBlock<"ox"> = {
        ...oxBlockTrue,
        answer: { type: "ox", answer: false },
      };

      const result = JSON.parse(normalizeBlock(oxBlockFalse));
      expect(result.correctAnswer).toBe("x");
    });
  });

  describe("mcq block (객관식)", () => {
    const mcqBlock: WorkBookBlock<"mcq"> = {
      id: "test-mcq-id",
      type: "mcq",
      question: "가장 큰 대륙은?",
      order: 3,
      content: {
        type: "mcq",
        options: [
          { id: "opt-1", type: "text", text: "아시아" },
          { id: "opt-2", type: "text", text: "유럽" },
          { id: "opt-3", type: "text", text: "아프리카" },
        ],
      },
      answer: { type: "mcq", answer: "opt-1" },
    };

    it("should normalize mcq block content as option texts", () => {
      const result = JSON.parse(normalizeBlock(mcqBlock));

      expect(result.type).toBe("mcq");
      expect(result.content).toEqual(["아시아", "유럽", "아프리카"]);
      expect(result.correctAnswer).toBe("아시아");
    });

    it("should return noOption message when options are empty", () => {
      const blockWithoutOptions: WorkBookBlock<"mcq"> = {
        ...mcqBlock,
        content: { type: "mcq", options: [] } as any,
      };

      const result = JSON.parse(normalizeBlock(blockWithoutOptions));
      expect(result.content).toBe("보기를 작성하지 않음");
    });

    it("should return noAnswer when answer not found in options", () => {
      const blockWithWrongAnswer: WorkBookBlock<"mcq"> = {
        ...mcqBlock,
        answer: { type: "mcq", answer: "non-existent-id" },
      };

      const result = JSON.parse(normalizeBlock(blockWithWrongAnswer));
      expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
    });

    it("should handle source type options", () => {
      const blockWithSource: WorkBookBlock<"mcq"> = {
        ...mcqBlock,
        content: {
          type: "mcq",
          options: [
            {
              id: "opt-1",
              type: "source",
              mimeType: "image/png",
              url: "https://example.com/image.png",
            },
            { id: "opt-2", type: "text", text: "텍스트 옵션" },
          ],
        },
        answer: { type: "mcq", answer: "opt-1" },
      };

      const result = JSON.parse(normalizeBlock(blockWithSource));
      expect(result.content).toEqual([
        "https://example.com/image.png",
        "텍스트 옵션",
      ]);
      expect(result.correctAnswer).toBe("https://example.com/image.png");
    });
  });

  describe("mcq-multiple block (객관식 다중)", () => {
    const mcqMultipleBlock: WorkBookBlock<"mcq-multiple"> = {
      id: "test-mcq-multiple-id",
      type: "mcq-multiple",
      question: "아시아에 있는 나라를 모두 고르시오",
      order: 4,
      content: {
        type: "mcq-multiple",
        options: [
          { id: "opt-1", type: "text", text: "한국" },
          { id: "opt-2", type: "text", text: "일본" },
          { id: "opt-3", type: "text", text: "프랑스" },
          { id: "opt-4", type: "text", text: "중국" },
        ],
      },
      answer: {
        type: "mcq-multiple",
        answer: ["opt-1", "opt-2", "opt-4"],
      },
    };

    it("should normalize mcq-multiple block correctly", () => {
      const result = JSON.parse(normalizeBlock(mcqMultipleBlock));

      expect(result.type).toBe("mcq-multiple");
      expect(result.content).toEqual(["한국", "일본", "프랑스", "중국"]);
      expect(result.correctAnswer).toEqual(["한국", "일본", "중국"]);
    });

    it("should return noAnswer when answer array is empty", () => {
      const blockWithEmptyAnswer: WorkBookBlock<"mcq-multiple"> = {
        ...mcqMultipleBlock,
        answer: { type: "mcq-multiple", answer: [] },
      };

      const result = JSON.parse(normalizeBlock(blockWithEmptyAnswer));
      expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
    });

    it("should filter out non-existent answer ids", () => {
      const blockWithPartialWrongAnswer: WorkBookBlock<"mcq-multiple"> = {
        ...mcqMultipleBlock,
        answer: {
          type: "mcq-multiple",
          answer: ["opt-1", "non-existent", "opt-2"],
        },
      };

      const result = JSON.parse(normalizeBlock(blockWithPartialWrongAnswer));
      expect(result.correctAnswer).toEqual(["한국", "일본"]);
    });
  });

  describe("ranking block (순위 맞추기)", () => {
    const rankingBlock: WorkBookBlock<"ranking"> = {
      id: "test-ranking-id",
      type: "ranking",
      question: "인구가 많은 순서대로 나열하세요",
      order: 5,
      content: {
        type: "ranking",
        items: [
          { id: "item-1", type: "text", text: "중국" },
          { id: "item-2", type: "text", text: "인도" },
          { id: "item-3", type: "text", text: "미국" },
        ],
      },
      answer: {
        type: "ranking",
        order: ["item-1", "item-2", "item-3"],
      },
    };

    it("should normalize ranking block correctly", () => {
      const result = JSON.parse(normalizeBlock(rankingBlock));

      expect(result.type).toBe("ranking");
      expect(result.content).toEqual(["중국", "인도", "미국"]);
      expect(result.correctAnswer).toEqual(["중국", "인도", "미국"]);
    });

    it("should return noOption when items are empty", () => {
      const blockWithoutItems: WorkBookBlock<"ranking"> = {
        ...rankingBlock,
        content: { type: "ranking", items: [] } as any,
      };

      const result = JSON.parse(normalizeBlock(blockWithoutItems));
      expect(result.content).toBe("보기를 작성하지 않음");
    });

    it("should filter out non-existent item ids in answer", () => {
      const blockWithPartialWrongOrder: WorkBookBlock<"ranking"> = {
        ...rankingBlock,
        answer: {
          type: "ranking",
          order: ["item-1", "non-existent", "item-3"],
        },
      };

      const result = JSON.parse(normalizeBlock(blockWithPartialWrongOrder));
      expect(result.correctAnswer).toEqual(["중국", "미국"]);
    });

    it("should handle source type items", () => {
      const blockWithSource: WorkBookBlock<"ranking"> = {
        ...rankingBlock,
        content: {
          type: "ranking",
          items: [
            {
              id: "item-1",
              type: "source",
              mimeType: "image/png",
              url: "https://example.com/1.png",
            },
            { id: "item-2", type: "text", text: "텍스트" },
          ],
        },
        answer: { type: "ranking", order: ["item-1", "item-2"] },
      };

      const result = JSON.parse(normalizeBlock(blockWithSource));
      expect(result.content).toEqual(["https://example.com/1.png", "텍스트"]);
    });
  });

  describe("edge cases", () => {
    it("should trim question whitespace", () => {
      const block: WorkBookBlock<"default"> = {
        id: "test-id",
        type: "default",
        question: "  질문입니다  ",
        order: 1,
        content: { type: "default" },
        answer: { type: "default", answer: ["답"] },
      };

      const result = JSON.parse(normalizeBlock(block));
      expect(result.question).toBe("질문입니다");
    });

    it("should trim solution whitespace", () => {
      const block: WorkBookBlock<"default"> = {
        id: "test-id",
        type: "default",
        question: "질문",
        order: 1,
        content: { type: "default" },
        answer: {
          type: "default",
          answer: ["답"],
          solution: "  설명입니다  ",
        },
      };

      const result = JSON.parse(normalizeBlock(block));
      expect(result.solution).toBe("설명입니다");
    });

    it("should handle missing answer type", () => {
      const block: WorkBookBlock<"default"> = {
        id: "test-id",
        type: "default",
        question: "질문",
        order: 1,
        content: { type: "default" },
        answer: {} as any,
      };

      const result = JSON.parse(normalizeBlock(block));
      expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
    });
  });
});
