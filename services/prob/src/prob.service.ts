import { eq } from "drizzle-orm";
import { pgDb } from "./db";
import {
  probBookSchema,
  probContentSchema,
  probOptionSchema,
  probSchema,
} from "./schema";
import { ProbBlock, ProbBook } from "./types";

export const probService = {
  findAll: async (): Promise<ProbBook[]> => {
    const probBooks = await pgDb.select().from(probBookSchema);

    // 각 문제집에 대해 관련 문제들을 조회하고 조합
    const results = await Promise.all(
      probBooks.map(async (book) => {
        const blocks = await _getProbBlocks(book.id);
        return {
          ...book,
          blocks,
        } as ProbBook;
      }),
    );

    return results;
  },

  findById: async (id: string): Promise<ProbBook | null> => {
    const [probBook] = await pgDb
      .select()
      .from(probBookSchema)
      .where(eq(probBookSchema.id, id));

    if (!probBook) return null;

    const blocks = await _getProbBlocks(id);

    return {
      ...probBook,
      blocks,
    } as ProbBook;
  },

  findByOwnerId: async (ownerId: string): Promise<ProbBook[]> => {
    const probBooks = await pgDb
      .select()
      .from(probBookSchema)
      .where(eq(probBookSchema.ownerId, ownerId));

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const blocks = await _getProbBlocks(book.id);
        return {
          ...book,
          blocks,
        } as ProbBook;
      }),
    );

    return results;
  },

  save: async (probBookData: ProbBook): Promise<ProbBook> => {
    return await pgDb.transaction(async (tx) => {
      // 문제집 저장 (blocks 제외)
      const { blocks, ...bookData } = probBookData;

      const [savedBook] = await tx
        .insert(probBookSchema)
        .values({
          ...bookData,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [probBookSchema.id],
          set: {
            ...bookData,
            updatedAt: new Date(),
          },
        })
        .returning();

      // 기존 문제들 삭제 (CASCADE로 관련 데이터도 자동 삭제)
      await tx
        .delete(probSchema)
        .where(eq(probSchema.probBookId, savedBook.id));

      // 새로운 문제들 저장
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        // 문제 저장
        const [savedProb] = await tx
          .insert(probSchema)
          .values({
            id: block.id,
            probBookId: savedBook.id,
            title: block.title,
            style: block.style,
            answerMeta: block.answerMeta,
            tags: block.tags,
          })
          .returning();

        // 문제 내용 저장
        await _saveProbContent(tx, savedProb.id, block.content);

        // 문제 선택지들 저장
        if (block.options) {
          for (let j = 0; j < block.options.length; j++) {
            const option = block.options[j];
            const optionData = option.data as any;
            await tx.insert(probOptionSchema).values({
              probId: savedProb.id,
              type: option.type,
              content: optionData.content,
              url: optionData.url || null,
              isCorrect: false, // 기본값, 필요시 로직 추가
            });
          }
        }
      }

      // 저장된 데이터 조회해서 반환
      const resultBlocks = await _getProbBlocks(savedBook.id);
      return {
        ...savedBook,
        blocks: resultBlocks,
      } as ProbBook;
    });
  },

  deleteById: async (id: string): Promise<void> => {
    await pgDb.delete(probBookSchema).where(eq(probBookSchema.id, id));
  },

  searchByTitle: async (searchTerm: string): Promise<ProbBook[]> => {
    const probBooks = await pgDb
      .select()
      .from(probBookSchema)
      .where(eq(probBookSchema.title, searchTerm));

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const blocks = await _getProbBlocks(book.id);
        return {
          ...book,
          blocks,
        } as ProbBook;
      }),
    );

    return results;
  },
};

// 헬퍼 함수: 문제집 ID로 ProbBlock[] 조회
async function _getProbBlocks(probBookId: string): Promise<ProbBlock[]> {
  // 문제들을 순서대로 조회
  const probs = await pgDb
    .select()
    .from(probSchema)
    .where(eq(probSchema.probBookId, probBookId));

  const blocks = await Promise.all(
    probs.map(async (prob) => {
      // 문제 내용들 조회
      const contents = await pgDb
        .select()
        .from(probContentSchema)
        .where(eq(probContentSchema.probId, prob.id));

      // 문제 선택지들 조회
      const options = await pgDb
        .select()
        .from(probOptionSchema)
        .where(eq(probOptionSchema.probId, prob.id));

      // ProbBlock 형태로 변환
      const probBlock: ProbBlock = {
        id: prob.id,
        style: prob.style,
        title: prob.title || undefined,
        tags: prob.tags || undefined,
        answerMeta: prob.answerMeta,
        // content 타입에 따라 처리
        content: _buildProbContent(contents),
        // 선택지들 변환
        options: options.map((option) => ({
          id: option.id.toString(),
          type: option.type as any,
          data: {
            content: option.content,
            url: option.url || undefined,
          } as any,
        })),
      };

      return probBlock;
    }),
  );

  return blocks;
}

// 헬퍼 함수: content 저장 (mixed 배열 지원)
async function _saveProbContent(tx: any, probId: string, content: any) {
  const contentData = content.data as any;

  // mixed 타입인 경우 - 배열의 각 요소를 별도 row로 저장
  if (content.type === "mixed" && Array.isArray(contentData)) {
    for (let i = 0; i < contentData.length; i++) {
      const item = contentData[i];
      await tx.insert(probContentSchema).values({
        probId: probId,
        type: "mixed",
        content: item.content,
        url: item.url || null,
        duration: item.duration || null,
      });
    }
  } else {
    // 다른 타입들 (text, image, video, audio) - 단일 저장
    await tx.insert(probContentSchema).values({
      probId: probId,
      type: content.type,
      content: contentData.content,
      url: contentData.url || null,
      duration: contentData.duration || null,
    });
  }
}

// 헬퍼 함수: content 타입에 따라 적절히 변환
function _buildProbContent(contents: any[]): any {
  if (!contents || contents.length === 0) {
    return {
      id: "default",
      type: "text",
      data: { content: "" },
    };
  }

  const firstContent = contents[0];

  // mixed 타입인 경우 - 배열로 조합
  if (firstContent.type === "mixed") {
    const mixedData = contents
      .filter((c) => c.type === "mixed")
      .map((c) => ({
        content: c.content,
        url: c.url || undefined,
        duration: c.duration || undefined,
      }));

    return {
      id: firstContent.id.toString(),
      type: "mixed",
      data: mixedData,
    };
  }

  // 다른 타입들 (text, image, video, audio) - 첫 번째만 사용
  return {
    id: firstContent.id.toString(),
    type: firstContent.type as any,
    data: {
      content: firstContent.content,
      url: firstContent.url || undefined,
      duration: firstContent.duration || undefined,
    } as any,
  };
}
