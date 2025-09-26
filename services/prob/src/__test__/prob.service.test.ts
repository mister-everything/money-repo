import { describe, expect, it } from "vitest";
import { probService } from "../prob.service";
import { ProbBookSaveInput } from "../types";

describe("ProbService CRUD Tests", () => {
  let testProbBookId: string;
  const timestamp = Date.now();

  const sampleProbBook: ProbBookSaveInput = {
    ownerId: "test-user-123",
    title: "수학 기초 문제집",
    description: "초등학교 수학 기초 문제 모음",
    tags: ["수학", "초등", "기초"],
    blocks: [
      {
        id: `prob-1-${timestamp}`,
        style: "generalFormat",
        title: "덧셈 문제",
        content: {
          id: `content-1-${timestamp}`,
          type: "text",
          data: {
            content: "2 + 3 = ?",
          },
        },
        answerMeta: {
          kind: "objective",
          multiple: false,
          randomized: false,
        },
        options: [
          {
            id: `option-1-${timestamp}`,
            type: "text",
            data: { content: "4" },
          },
          {
            id: `option-2-${timestamp}`,
            type: "text",
            data: { content: "5" },
          },
          {
            id: `option-3-${timestamp}`,
            type: "text",
            data: { content: "6" },
          },
        ],
        tags: ["덧셈", "기초연산"],
      },
      {
        id: `prob-2-${timestamp}`,
        style: "generalFormat",
        title: "주관식 문제",
        content: {
          id: `content-2-${timestamp}`,
          type: "text",
          data: {
            content: "10에서 7을 뺀 값을 적으세요.",
          },
        },
        answerMeta: {
          kind: "subjective",
          charLimit: 10,
          lines: 1,
          placeholder: "답을 입력하세요",
        },
        tags: ["뺄셈", "주관식"],
      },
    ],
  };

  // CREATE 테스트
  it("문제집 생성", async () => {
    console.log("🔧 CREATE 테스트 시작...");

    const result = await probService.save(sampleProbBook);
    testProbBookId = result.id;

    expect(result).toBeDefined();
    expect(result.title).toBe(sampleProbBook.title);
    expect(result.ownerId).toBe(sampleProbBook.ownerId);
    expect(result.blocks).toHaveLength(2);
    expect(result.tags).toHaveLength(3);

    console.log("✅ 문제집 생성 성공:", result.id);
  });

  // READ 테스트
  it("문제집 조회", async () => {
    console.log("🔧 READ 테스트 시작...");

    const result = await probService.findById(testProbBookId);

    expect(result).toBeDefined();
    expect(result?.id).toBe(testProbBookId);
    expect(result?.blocks).toHaveLength(2);

    // 첫 번째 문제 검증
    const firstProb = result?.blocks[0];
    expect(firstProb?.answerMeta.kind).toBe("objective");
    expect(firstProb?.options).toHaveLength(3);

    // 두 번째 문제 검증
    const secondProb = result?.blocks[1];
    expect(secondProb?.answerMeta.kind).toBe("subjective");
    expect((secondProb?.answerMeta as any).charLimit).toBe(10);

    console.log("✅ 문제집 조회 성공");
  });

  // LIST 테스트
  it("문제집 목록 조회", async () => {
    console.log("🔧 LIST 테스트 시작...");

    const allBooks = await probService.findAll();
    const ownerBooks = await probService.findByOwnerId(sampleProbBook.ownerId);

    expect(allBooks.length).toBeGreaterThan(0);
    expect(ownerBooks.length).toBeGreaterThan(0);
    expect(
      ownerBooks.every((book) => book.ownerId === sampleProbBook.ownerId),
    ).toBe(true);

    console.log("✅ 문제집 목록 조회 성공");
  });

  // UPDATE 테스트
  it("문제집 수정", async () => {
    console.log("🔧 UPDATE 테스트 시작...");

    const updateData: ProbBookSaveInput = {
      ...sampleProbBook,
      id: testProbBookId,
      title: "수정된 수학 기초 문제집",
      description: "수정된 설명",
      blocks: [
        {
          ...sampleProbBook.blocks[0],
          id: `prob-1-updated-${timestamp}`,
          title: "수정된 덧셈 문제",
          content: {
            ...sampleProbBook.blocks[0].content,
            id: `content-1-updated-${timestamp}`,
          },
          options: sampleProbBook.blocks[0].options?.map((option, index) => ({
            ...option,
            id: `option-${index + 1}-updated-${timestamp}`,
          })),
        },
      ],
      tags: ["수학", "초등", "수정됨"],
    };

    const result = await probService.save(updateData);

    expect(result.title).toBe("수정된 수학 기초 문제집");
    expect(result.blocks).toHaveLength(1);
    expect(result.tags.some((tag) => tag.name === "수정됨")).toBe(true);

    console.log("✅ 문제집 수정 성공");
  });

  // 태그 검색 테스트
  it("태그로 검색", async () => {
    console.log("🔧 태그 검색 테스트 시작...");

    const tagResults = await probService.findByTags(["수학"]);
    expect(tagResults.length).toBeGreaterThan(0);

    const allTags = await probService.getAllTags();
    expect(allTags.length).toBeGreaterThan(0);

    const tagStats = await probService.getTagStats();
    expect(tagStats.length).toBeGreaterThan(0);

    console.log("✅ 태그 검색 성공");
  });

  // DELETE 테스트
  it("문제집 삭제", async () => {
    console.log("🔧 DELETE 테스트 시작...");

    await probService.deleteById(testProbBookId);

    const deletedBook = await probService.findById(testProbBookId);
    expect(deletedBook).toBeNull();

    console.log("✅ 문제집 삭제 성공");
  });
});
