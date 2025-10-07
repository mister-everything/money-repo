import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { pgDb } from "./db";
import {
  probBlockAnswerSubmitsTable,
  probBlocksTable,
  probBookSubmitsTable,
  probBooksTable,
  probBookTagsTable,
  tagsTable,
} from "./schema";
import {
  checkAnswer,
  ProbBlock,
  ProbBlockAnswerSubmit,
  ProbBook,
  ProbBookSaveInput,
  ProbBookSubmit,
  Tag,
} from "./types";

export const probService = {
  // ============================================================
  // 문제집 조회 기능
  // ============================================================

  /**
   * 모든 문제집 조회
   */
  findAll: async (): Promise<ProbBook[]> => {
    const probBooks = await pgDb.select().from(probBooksTable);

    // 각 문제집에 대해 관련 데이터들을 조회하고 조합
    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  /**
   * ID로 문제집 조회
   */
  findById: async (id: number): Promise<ProbBook | null> => {
    const [probBook] = await pgDb
      .select()
      .from(probBooksTable)
      .where(eq(probBooksTable.id, id));

    if (!probBook) return null;

    const [blocks, tags] = await Promise.all([
      _getProbBlocks(id),
      _getBookTags(id),
    ]);

    return {
      ...probBook,
      blocks,
      tags,
    } as ProbBook;
  },

  /**
   * 소유자 ID로 문제집 조회
   */
  findByOwnerId: async (ownerId: string): Promise<ProbBook[]> => {
    const probBooks = await pgDb
      .select()
      .from(probBooksTable)
      .where(eq(probBooksTable.ownerId, ownerId));

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  /**
   * 공개된 문제집 조회
   */
  findPublic: async (): Promise<ProbBook[]> => {
    const probBooks = await pgDb
      .select()
      .from(probBooksTable)
      .where(eq(probBooksTable.isPublic, true));

    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  // ============================================================
  // 문제집 저장/수정 기능
  // ============================================================

  /**
   * 문제집 저장 (생성 또는 업데이트)
   */
  save: async (probBookData: ProbBookSaveInput): Promise<ProbBook> => {
    try {
      const savedBookId = await pgDb.transaction(async (tx) => {
        const { blocks, tags, ...bookData } = probBookData;

        // 1. 문제집 저장
        let bookId: number;

        if (probBookData.id) {
          // 기존 문제집 업데이트
          await tx
            .update(probBooksTable)
            .set({
              ...bookData,
              updatedAt: new Date(),
            })
            .where(eq(probBooksTable.id, probBookData.id));

          bookId = probBookData.id;

          // 기존 문제들과 태그 관계 삭제
          await Promise.all([
            tx
              .delete(probBlocksTable)
              .where(eq(probBlocksTable.probBookId, bookId)),
            tx
              .delete(probBookTagsTable)
              .where(eq(probBookTagsTable.probBookId, bookId)),
          ]);
        } else {
          // 새 문제집 생성
          const [newBook] = await tx
            .insert(probBooksTable)
            .values(bookData)
            .returning({ id: probBooksTable.id });

          bookId = newBook.id;
        }

        // 2. 문제 블록들 저장
        if (blocks && blocks.length > 0) {
          const blockInsertData = blocks.map((block, index) => ({
            probBookId: bookId,
            order: block.order ?? index,
            type: block.type,
            question: block.question,
            content: block.content,
            answer: block.answer,
          }));

          await tx.insert(probBlocksTable).values(blockInsertData);
        }

        // 3. 태그 처리
        if (tags && tags.length > 0) {
          const tagIds = await _getOrCreateTags(tx, tags);

          const tagRelations = tagIds.map((tagId) => ({
            probBookId: bookId,
            tagId,
          }));

          await tx.insert(probBookTagsTable).values(tagRelations);
        }

        return bookId;
      });

      // 저장된 문제집 조회 후 반환
      const savedBook = await probService.findById(savedBookId);
      if (!savedBook) {
        throw new Error("저장된 문제집을 찾을 수 없습니다.");
      }

      return savedBook;
    } catch (error) {
      console.error("문제집 저장 중 오류:", error);
      throw new Error("문제집 저장에 실패했습니다.");
    }
  },

  /**
   * 문제집 삭제
   */
  delete: async (id: number): Promise<void> => {
    await pgDb.delete(probBooksTable).where(eq(probBooksTable.id, id));
  },

  /**
   * 문제집 삭제 (별칭)
   */
  deleteById: async (id: number): Promise<void> => {
    await probService.delete(id);
  },

  /**
   * 태그로 문제집 검색
   */
  findByTags: async (tagNames: string[]): Promise<ProbBook[]> => {
    // 태그 이름으로 태그 ID들 조회
    const tags = await pgDb
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(inArray(tagsTable.name, tagNames));

    if (tags.length === 0) {
      return [];
    }

    const tagIds = tags.map((tag) => tag.id);

    // 해당 태그들을 가진 문제집들 조회
    const probBookIds = await pgDb
      .selectDistinct({ probBookId: probBookTagsTable.probBookId })
      .from(probBookTagsTable)
      .where(inArray(probBookTagsTable.tagId, tagIds));

    if (probBookIds.length === 0) {
      return [];
    }

    const bookIds = probBookIds.map((book) => book.probBookId);

    // 문제집 상세 정보 조회
    const probBooks = await pgDb
      .select()
      .from(probBooksTable)
      .where(inArray(probBooksTable.id, bookIds));

    // 각 문제집의 블록과 태그 정보 추가
    const results = await Promise.all(
      probBooks.map(async (book) => {
        const [blocks, tags] = await Promise.all([
          _getProbBlocks(book.id),
          _getBookTags(book.id),
        ]);
        return {
          ...book,
          blocks,
          tags,
        } as ProbBook;
      }),
    );

    return results;
  },

  // ============================================================
  // 문제집 제출 세션 관리
  // ============================================================

  /**
   * 문제집 제출 세션 시작
   */
  startSubmitSession: async (
    probBookId: number,
    ownerId: string,
  ): Promise<ProbBookSubmit> => {
    // 문제집 확인
    const probBook = await probService.findById(probBookId);
    if (!probBook) {
      throw new Error("문제집을 찾을 수 없습니다.");
    }

    const [session] = await pgDb
      .insert(probBookSubmitsTable)
      .values({
        probBookId,
        ownerId,
        startTime: new Date(),
        totalQuestions: probBook.blocks.length,
      })
      .returning();

    return session as ProbBookSubmit;
  },

  /**
   * 문제집 제출 세션 종료
   */
  endSubmitSession: async (
    sessionId: number,
    score?: number,
  ): Promise<ProbBookSubmit> => {
    const [session] = await pgDb
      .update(probBookSubmitsTable)
      .set({
        endTime: new Date(),
        score: score ?? 0,
      })
      .where(eq(probBookSubmitsTable.id, sessionId))
      .returning();

    return session as ProbBookSubmit;
  },

  /**
   * 문제 답안 제출
   */
  submitAnswer: async (
    blockId: number,
    sessionId: number,
    answer: ProbBlockAnswerSubmit,
  ): Promise<boolean> => {
    // 해당 문제의 정답 조회
    const [block] = await pgDb
      .select()
      .from(probBlocksTable)
      .where(eq(probBlocksTable.id, blockId));

    if (!block) {
      throw new Error("문제를 찾을 수 없습니다.");
    }

    // 답안 검증
    const isCorrect = checkAnswer(block.answer ?? undefined, answer);

    // 답안 저장
    await pgDb
      .insert(probBlockAnswerSubmitsTable)
      .values({
        blockId,
        submitId: sessionId,
        answer,
        isCorrect,
      })
      .onConflictDoUpdate({
        target: [
          probBlockAnswerSubmitsTable.blockId,
          probBlockAnswerSubmitsTable.submitId,
        ],
        set: {
          answer,
          isCorrect,
          createdAt: new Date(),
        },
      });

    // 세션의 정답 수 업데이트
    await _updateSessionScore(sessionId);

    return isCorrect;
  },

  /**
   * 제출 세션 조회
   */
  getSubmitSession: async (
    sessionId: number,
  ): Promise<ProbBookSubmit | null> => {
    const [session] = await pgDb
      .select()
      .from(probBookSubmitsTable)
      .where(eq(probBookSubmitsTable.id, sessionId));

    return (session as ProbBookSubmit) || null;
  },

  /**
   * 사용자의 제출 이력 조회
   */
  getSubmitHistory: async (
    ownerId: string,
    probBookId?: number,
  ): Promise<ProbBookSubmit[]> => {
    const whereConditions = [eq(probBookSubmitsTable.ownerId, ownerId)];

    if (probBookId) {
      whereConditions.push(eq(probBookSubmitsTable.probBookId, probBookId));
    }

    const sessions = await pgDb
      .select()
      .from(probBookSubmitsTable)
      .where(and(...whereConditions))
      .orderBy(asc(probBookSubmitsTable.createdAt));

    return sessions as ProbBookSubmit[];
  },

  // ============================================================
  // 태그 관리
  // ============================================================

  /**
   * 모든 태그 조회
   */
  getAllTags: async (): Promise<Tag[]> => {
    return await pgDb.select().from(tagsTable).orderBy(asc(tagsTable.name));
  },
};

// ============================================================
// 헬퍼 함수들
// ============================================================

/**
 * 문제집 ID로 ProbBlock[] 조회
 */
async function _getProbBlocks(probBookId: number): Promise<ProbBlock[]> {
  const blocks = await pgDb
    .select()
    .from(probBlocksTable)
    .where(eq(probBlocksTable.probBookId, probBookId))
    .orderBy(asc(probBlocksTable.order));

  return blocks.map((block) => ({
    ...block,
    tags: [], // TODO: 문제별 태그는 추후 구현
  })) as ProbBlock[];
}

/**
 * 문제집의 태그 조회 (문자열 배열로 반환)
 */
async function _getBookTags(probBookId: number): Promise<string[]> {
  const tagRelations = await pgDb
    .select({
      tagName: tagsTable.name,
    })
    .from(probBookTagsTable)
    .innerJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
    .where(eq(probBookTagsTable.probBookId, probBookId));

  return tagRelations.map((relation) => relation.tagName);
}

/**
 * 태그들을 찾거나 생성하고 ID 반환
 */
async function _getOrCreateTags(
  tx: any,
  tagNames: string[],
): Promise<number[]> {
  // 기존 태그들 조회
  const existingTags = await tx
    .select()
    .from(tagsTable)
    .where(inArray(tagsTable.name, tagNames));

  const existingTagNames = existingTags.map((tag: Tag) => tag.name);
  const existingTagIds = existingTags.map((tag: Tag) => tag.id);

  // 새로 생성해야 할 태그들
  const newTagNames = tagNames.filter(
    (name) => !existingTagNames.includes(name),
  );

  if (newTagNames.length > 0) {
    const newTags = await tx
      .insert(tagsTable)
      .values(newTagNames.map((name) => ({ name })))
      .returning({ id: tagsTable.id });

    return [...existingTagIds, ...newTags.map((tag: { id: number }) => tag.id)];
  }

  return existingTagIds;
}

/**
 * 제출 세션의 점수 업데이트
 */
async function _updateSessionScore(sessionId: number): Promise<void> {
  // 해당 세션의 정답 수 계산
  const [result] = await pgDb
    .select({
      correctCount: sql<number>`COUNT(CASE WHEN ${probBlockAnswerSubmitsTable.isCorrect} THEN 1 END)`,
    })
    .from(probBlockAnswerSubmitsTable)
    .where(eq(probBlockAnswerSubmitsTable.submitId, sessionId));

  const correctCount = result ? Number(result.correctCount) || 0 : 0;

  // 세션 업데이트
  await pgDb
    .update(probBookSubmitsTable)
    .set({ correctCount })
    .where(eq(probBookSubmitsTable.id, sessionId));
}
