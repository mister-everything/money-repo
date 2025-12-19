import { describe, expect, it } from "vitest";
import { serializeDetailBlock, serializeSummaryBlock } from "./serialize-block";
import { WorkBookBlock } from "./types";

describe("serialize-block", () => {
  describe("serializeSummaryBlock", () => {
    it("기본 블록을 요약 형식으로 직렬화한다", () => {
      const block: WorkBookBlock<"default"> = {
        id: "test-id",
        question: "한국의 수도는?",
        type: "default",
        order: 1,
        content: { type: "default" },
        answer: { type: "default", answer: ["서울"] },
      };

      const result = serializeSummaryBlock(block);

      expect(result).toEqual({
        order: 1,
        ref: "summary",
        type: "주관식",
        question: "한국의 수도는?",
      });
    });

    it("긴 질문은 30자로 잘린다", () => {
      const block: WorkBookBlock<"default"> = {
        id: "test-id",
        question:
          "이것은 매우 긴 질문입니다. 30자가 넘어가면 잘려야 합니다. 정말 길죠?",
        type: "default",
        order: 2,
        content: { type: "default" },
        answer: { type: "default", answer: ["답"] },
      };

      const result = serializeSummaryBlock(block);

      expect(result.question.length).toBeLessThanOrEqual(33); // 30 + "..."
      expect(result.question).toContain("...");
    });

    it("질문 앞뒤 공백이 제거된다", () => {
      const block: WorkBookBlock<"default"> = {
        id: "test-id",
        question: "  공백이 있는 질문  ",
        type: "default",
        order: 1,
        content: { type: "default" },
        answer: { type: "default", answer: ["답"] },
      };

      const result = serializeSummaryBlock(block);

      expect(result.question).toBe("공백이 있는 질문");
    });

    it("각 블록 타입별 displayName을 반환한다", () => {
      const testCases: Array<{
        type: WorkBookBlock["type"];
        expected: string;
      }> = [
        { type: "default", expected: "주관식" },
        { type: "mcq", expected: "객관식" },
        { type: "mcq-multiple", expected: "객관식 다중" },
        { type: "ranking", expected: "순위 맞추기" },
        { type: "ox", expected: "OX 퀴즈" },
      ];

      for (const { type, expected } of testCases) {
        const block = createMockBlock(type);
        const result = serializeSummaryBlock(block);
        expect(result.type).toBe(expected);
      }
    });
  });

  describe("serializeDetailBlock", () => {
    describe("default 블록", () => {
      it("주관식 블록을 상세 형식으로 직렬화한다", () => {
        const block: WorkBookBlock<"default"> = {
          id: "default-id",
          question: "한국의 수도는?",
          type: "default",
          order: 1,
          content: { type: "default" },
          answer: {
            type: "default",
            answer: ["서울", "Seoul"],
            solution: "해설입니다",
          },
        };

        const result = serializeDetailBlock(block);

        expect(result).toMatchObject({
          order: 1,
          ref: "detail",
          id: "default-id",
          type: "주관식",
          question: "한국의 수도는?",
          content: undefined,
          correctAnswer: ["서울", "Seoul"],
          solution: "해설입니다",
        });
      });

      it("정답이 없으면 '정답을 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"default"> = {
          id: "default-id",
          question: "질문?",
          type: "default",
          order: 1,
          content: { type: "default" },
          answer: { type: "default", answer: [] },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
      });
    });

    describe("ox 블록", () => {
      it("OX 블록에서 정답이 true면 'o'를 반환한다", () => {
        const block: WorkBookBlock<"ox"> = {
          id: "ox-id",
          question: "서울은 한국의 수도다",
          type: "ox",
          order: 1,
          content: { type: "ox" },
          answer: { type: "ox", answer: true },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("o");
        expect(result.content).toBeUndefined();
      });

      it("OX 블록에서 정답이 false면 'x'를 반환한다", () => {
        const block: WorkBookBlock<"ox"> = {
          id: "ox-id",
          question: "도쿄는 한국의 수도다",
          type: "ox",
          order: 1,
          content: { type: "ox" },
          answer: { type: "ox", answer: false },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("x");
      });
    });

    describe("mcq 블록", () => {
      it("객관식 블록을 직렬화한다", () => {
        const block: WorkBookBlock<"mcq"> = {
          id: "mcq-id",
          question: "한국의 수도는?",
          type: "mcq",
          order: 1,
          content: {
            type: "mcq",
            options: [
              { id: "opt-1", type: "text", text: "서울" },
              { id: "opt-2", type: "text", text: "부산" },
              { id: "opt-3", type: "text", text: "대구" },
            ],
          },
          answer: { type: "mcq", answer: "opt-1" },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toEqual(["서울", "부산", "대구"]);
        expect(result.correctAnswer).toBe("서울");
      });

      it("이미지 옵션이 있으면 url을 반환한다", () => {
        const block: WorkBookBlock<"mcq"> = {
          id: "mcq-id",
          question: "어느 이미지가 서울인가요?",
          type: "mcq",
          order: 1,
          content: {
            type: "mcq",
            options: [
              {
                id: "opt-1",
                type: "source",
                mimeType: "image/png",
                url: "https://example.com/seoul.png",
              },
              {
                id: "opt-2",
                type: "source",
                mimeType: "image/png",
                url: "https://example.com/tokyo.png",
              },
            ],
          },
          answer: { type: "mcq", answer: "opt-1" },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toEqual([
          "https://example.com/seoul.png",
          "https://example.com/tokyo.png",
        ]);
        expect(result.correctAnswer).toBe("https://example.com/seoul.png");
      });

      it("옵션이 없으면 '보기를 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"mcq"> = {
          id: "mcq-id",
          question: "질문?",
          type: "mcq",
          order: 1,
          content: { type: "mcq", options: [] },
          answer: { type: "mcq", answer: "" },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toBe("보기를 작성하지 않음");
      });

      it("정답 옵션이 없으면 '정답을 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"mcq"> = {
          id: "mcq-id",
          question: "질문?",
          type: "mcq",
          order: 1,
          content: {
            type: "mcq",
            options: [{ id: "opt-1", type: "text", text: "서울" }],
          },
          answer: { type: "mcq", answer: "non-existent-id" },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
      });
    });

    describe("mcq-multiple 블록", () => {
      it("객관식 다중 블록을 직렬화한다", () => {
        const block: WorkBookBlock<"mcq-multiple"> = {
          id: "mcq-multi-id",
          question: "한국의 도시를 모두 고르세요",
          type: "mcq-multiple",
          order: 1,
          content: {
            type: "mcq-multiple",
            options: [
              { id: "opt-1", type: "text", text: "서울" },
              { id: "opt-2", type: "text", text: "도쿄" },
              { id: "opt-3", type: "text", text: "부산" },
            ],
          },
          answer: { type: "mcq-multiple", answer: ["opt-1", "opt-3"] },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toEqual(["서울", "도쿄", "부산"]);
        expect(result.correctAnswer).toEqual(["서울", "부산"]);
      });

      it("정답이 없으면 '정답을 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"mcq-multiple"> = {
          id: "mcq-multi-id",
          question: "질문?",
          type: "mcq-multiple",
          order: 1,
          content: {
            type: "mcq-multiple",
            options: [{ id: "opt-1", type: "text", text: "서울" }],
          },
          answer: { type: "mcq-multiple", answer: [] },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
      });

      it("옵션이 없으면 '정답을 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"mcq-multiple"> = {
          id: "mcq-multi-id",
          question: "질문?",
          type: "mcq-multiple",
          order: 1,
          content: { type: "mcq-multiple", options: [] },
          answer: { type: "mcq-multiple", answer: ["opt-1"] },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
      });
    });

    describe("ranking 블록", () => {
      it("순위 블록을 직렬화한다", () => {
        const block: WorkBookBlock<"ranking"> = {
          id: "ranking-id",
          question: "가장 큰 도시부터 순서대로 나열하세요",
          type: "ranking",
          order: 1,
          content: {
            type: "ranking",
            items: [
              { id: "item-1", type: "text", text: "서울" },
              { id: "item-2", type: "text", text: "부산" },
              { id: "item-3", type: "text", text: "대구" },
            ],
          },
          answer: { type: "ranking", order: ["item-1", "item-2", "item-3"] },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toEqual(["서울", "부산", "대구"]);
        expect(result.correctAnswer).toEqual(["서울", "부산", "대구"]);
      });

      it("이미지 항목이 있으면 url을 반환한다", () => {
        const block: WorkBookBlock<"ranking"> = {
          id: "ranking-id",
          question: "크기 순서대로 나열하세요",
          type: "ranking",
          order: 1,
          content: {
            type: "ranking",
            items: [
              {
                id: "item-1",
                type: "source",
                mimeType: "image/png",
                url: "https://example.com/big.png",
              },
              {
                id: "item-2",
                type: "source",
                mimeType: "image/png",
                url: "https://example.com/small.png",
              },
            ],
          },
          answer: { type: "ranking", order: ["item-1", "item-2"] },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toEqual([
          "https://example.com/big.png",
          "https://example.com/small.png",
        ]);
        expect(result.correctAnswer).toEqual([
          "https://example.com/big.png",
          "https://example.com/small.png",
        ]);
      });

      it("항목이 없으면 '보기를 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"ranking"> = {
          id: "ranking-id",
          question: "질문?",
          type: "ranking",
          order: 1,
          content: { type: "ranking", items: [] },
          answer: { type: "ranking", order: [] },
        };

        const result = serializeDetailBlock(block);

        expect(result.content).toBe("보기를 작성하지 않음");
      });

      it("정답 순서가 없으면 '정답을 작성하지 않음'을 반환한다", () => {
        const block: WorkBookBlock<"ranking"> = {
          id: "ranking-id",
          question: "질문?",
          type: "ranking",
          order: 1,
          content: {
            type: "ranking",
            items: [{ id: "item-1", type: "text", text: "서울" }],
          },
          answer: { type: "ranking", order: [] },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
      });

      it("존재하지 않는 항목 ID는 무시된다", () => {
        const block: WorkBookBlock<"ranking"> = {
          id: "ranking-id",
          question: "질문?",
          type: "ranking",
          order: 1,
          content: {
            type: "ranking",
            items: [{ id: "item-1", type: "text", text: "서울" }],
          },
          answer: {
            type: "ranking",
            order: ["item-1", "non-existent-id"],
          },
        };

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toEqual(["서울"]);
      });
    });

    describe("answer type이 없는 경우", () => {
      it("answer.type이 undefined면 '정답을 작성하지 않음'을 반환한다", () => {
        const block = {
          id: "test-id",
          question: "질문?",
          type: "default",
          order: 1,
          content: { type: "default" },
          answer: {},
        } as unknown as WorkBookBlock;

        const result = serializeDetailBlock(block);

        expect(result.correctAnswer).toBe("정답을 작성하지 않음.");
      });
    });

    describe("solution 처리", () => {
      it("solution이 있으면 공백을 제거하여 반환한다", () => {
        const block: WorkBookBlock<"default"> = {
          id: "test-id",
          question: "질문?",
          type: "default",
          order: 1,
          content: { type: "default" },
          answer: {
            type: "default",
            answer: ["답"],
            solution: "  해설입니다  ",
          },
        };

        const result = serializeDetailBlock(block);

        expect(result.solution).toBe("해설입니다");
      });

      it("solution이 없으면 undefined를 반환한다", () => {
        const block: WorkBookBlock<"default"> = {
          id: "test-id",
          question: "질문?",
          type: "default",
          order: 1,
          content: { type: "default" },
          answer: { type: "default", answer: ["답"] },
        };

        const result = serializeDetailBlock(block);

        expect(result.solution).toBeUndefined();
      });
    });
  });
});

// 헬퍼 함수
function createMockBlock(type: WorkBookBlock["type"]): WorkBookBlock {
  const baseBlock = {
    id: `${type}-id`,
    question: "테스트 질문",
    order: 1,
  };

  switch (type) {
    case "default":
      return {
        ...baseBlock,
        type: "default",
        content: { type: "default" },
        answer: { type: "default", answer: [] },
      };
    case "mcq":
      return {
        ...baseBlock,
        type: "mcq",
        content: { type: "mcq", options: [] },
        answer: { type: "mcq", answer: "" },
      };
    case "mcq-multiple":
      return {
        ...baseBlock,
        type: "mcq-multiple",
        content: { type: "mcq-multiple", options: [] },
        answer: { type: "mcq-multiple", answer: [] },
      };
    case "ranking":
      return {
        ...baseBlock,
        type: "ranking",
        content: { type: "ranking", items: [] },
        answer: { type: "ranking", order: [] },
      };
    case "ox":
      return {
        ...baseBlock,
        type: "ox",
        content: { type: "ox" },
        answer: { type: "ox", answer: true },
      };
  }
}
