import { userTable } from "@service/auth";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { All_BLOCKS, BlockAnswerSubmit } from "./blocks";
import {
  probBlockAnswerSubmitsTable,
  probBlocksTable,
  probBookSubmitsTable,
  probBooksTable,
  probBookTagsTable,
  tagsTable,
} from "./schema";
import {
  CreateProbBlock,
  CreateProbBook,
  createProbBlockSchema,
  createProbBookSchema,
  ProbBlock,
  ProbBook,
  ProbBookSubmitSession,
  ProbBookWithoutBlocks,
  SubmitProbBookResponse,
} from "./types";

export const probService = {
  isProbBookOwner: async (
    probBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [probBook] = await pgDb
      .select({
        ownerId: probBooksTable.ownerId,
      })
      .from(probBooksTable)
      .where(eq(probBooksTable.id, probBookId));
    return probBook?.ownerId === userId;
  },

  hasProbBookPermission: async (
    probBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [probBook] = await pgDb
      .select({
        id: probBooksTable.id,
        isPublic: probBooksTable.isPublic,
        ownerId: probBooksTable.ownerId,
      })
      .from(probBooksTable)
      .where(eq(probBooksTable.id, probBookId));
    const isOwner = probBook?.ownerId === userId;
    const isPublic = probBook?.isPublic;
    return isOwner || isPublic;
  },

  /**
   * 공개된 문제집 목록 조회
   * @todo 검색옵션 추가 (pagination, 검색어, 태그, 퍼블릭 여부, owner,id )
   */
  async searchProbBooks(options = {}): Promise<ProbBookWithoutBlocks[]> {
    const rows = await pgDb
      .select({
        id: probBooksTable.id,
        title: probBooksTable.title,
        description: probBooksTable.description,
        isPublic: probBooksTable.isPublic,
        thumbnail: probBooksTable.thumbnail,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
      })
      .from(probBooksTable)
      .innerJoin(userTable, eq(probBooksTable.ownerId, userTable.id))
      .leftJoin(
        probBookTagsTable,
        eq(probBooksTable.id, probBookTagsTable.probBookId),
      )
      .leftJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
      .groupBy(probBooksTable.id, userTable.id);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: row.tags ?? [],
      isPublic: row.isPublic,
      owner: {
        name: row.ownerName,
        profile: row.ownerProfile ?? undefined,
      },
      thumbnail: row.thumbnail ?? undefined,
    }));
  },

  selectProbBookById: async (id: string): Promise<ProbBook | null> => {
    const [book] = await pgDb
      .select({
        id: probBooksTable.id,
        title: probBooksTable.title,
        description: probBooksTable.description,
        isPublic: probBooksTable.isPublic,
        thumbnail: probBooksTable.thumbnail,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
      })
      .from(probBooksTable)
      .innerJoin(userTable, eq(probBooksTable.ownerId, userTable.id))
      .leftJoin(
        probBookTagsTable,
        eq(probBooksTable.id, probBookTagsTable.probBookId),
      )
      .leftJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
      .where(eq(probBooksTable.id, id))
      .groupBy(probBooksTable.id, userTable.id);

    if (!book) {
      return null;
    }
    const blocks = await pgDb
      .select({
        id: probBlocksTable.id,
        content: probBlocksTable.content,
        question: probBlocksTable.question,
        // answer: probBlocksTable.answer, // 풀이 모드에서는 정답 데이터 제외
        order: probBlocksTable.order,
        type: probBlocksTable.type,
      })
      .from(probBlocksTable)
      .where(eq(probBlocksTable.probBookId, id));

    return {
      id: book.id,
      title: book.title,
      description: book.description ?? undefined,
      isPublic: book.isPublic,
      thumbnail: book.thumbnail ?? undefined,
      blocks: blocks.map((block) => ({
        id: block.id,
        content: block.content,
        question: block.question ?? undefined,
        order: block.order,
        type: block.type,
      })),
      owner: {
        name: book.ownerName,
        profile: book.ownerProfile ?? undefined,
      },
      tags: book.tags ?? [],
    };
  },

  /**
   * 문제집에 태그 저장
   */
  saveTagByBookId: async (bookId: string, tags: string[]): Promise<void> => {
    // 기존 태그 삭제
    await pgDb
      .delete(probBookTagsTable)
      .where(eq(probBookTagsTable.probBookId, bookId));

    // 태그 저장
    await pgDb
      .insert(tagsTable)
      .values(
        tags.map((tag) => ({
          name: tag,
        })),
      )
      .onConflictDoNothing({
        target: [tagsTable.name],
      });
    const selectedTags = await pgDb
      .select({
        id: tagsTable.id,
      })
      .from(tagsTable)
      .where(inArray(tagsTable.name, tags));

    // 새 태그 저장
    await pgDb.insert(probBookTagsTable).values(
      selectedTags.map((tag) => ({
        probBookId: bookId,
        tagId: tag.id,
      })),
    );
  },

  /**
   * 문제집 생성
   */
  createProbBook: async (probBook: CreateProbBook): Promise<{ id: string }> => {
    const parsedProbBook = createProbBookSchema.parse(probBook);
    const data: typeof probBooksTable.$inferInsert = {
      ownerId: parsedProbBook.ownerId,
      title: parsedProbBook.title,
      description: parsedProbBook.description,
      isPublic: parsedProbBook.isPublic,
      thumbnail: parsedProbBook.thumbnail,
    };

    const [newProbBook] = await pgDb
      .insert(probBooksTable)
      .values(data)
      .returning({ id: probBooksTable.id });

    if (probBook.tags) {
      await probService.saveTagByBookId(newProbBook.id, probBook.tags);
    }
    return newProbBook;
  },

  /**
   * 문제집 삭제
   */
  deleteProbBook: async (id: string): Promise<void> => {
    await pgDb.delete(probBooksTable).where(eq(probBooksTable.id, id));
  },

  /**
   * 문제 생성
   */
  createProbBlock: async (probBlock: CreateProbBlock): Promise<ProbBlock> => {
    const parsedProbBlock = createProbBlockSchema.parse(probBlock);
    const data: typeof probBlocksTable.$inferInsert = {
      probBookId: parsedProbBlock.probBookId,
      order: parsedProbBlock.order,
      type: parsedProbBlock.type,
      question: parsedProbBlock.question,
      content: parsedProbBlock.content,
      answer: parsedProbBlock.answer,
    };

    const [newProbBlock] = await pgDb
      .insert(probBlocksTable)
      .values(data)
      .returning({
        id: probBlocksTable.id,
        content: probBlocksTable.content,
        question: probBlocksTable.question,
        answer: probBlocksTable.answer,
        order: probBlocksTable.order,
        type: probBlocksTable.type,
      });

    return {
      id: newProbBlock.id,
      type: newProbBlock.type,
      content: newProbBlock.content,
      question: newProbBlock.question ?? undefined,
      answer: newProbBlock.answer ?? undefined,
      order: newProbBlock.order,
    };
  },

  /**
   * 문제 삭제
   */
  deleteProbBlock: async (id: string): Promise<void> => {
    await pgDb.delete(probBlocksTable).where(eq(probBlocksTable.id, id));
  },

  /**
   * 문제집 세션 시작 또는 재개
   * 진행 중인 세션이 있으면 해당 세션을 반환하고, 없으면 새로 생성
   * @param probBookId 문제집 I
   * @param userId 사용자 ID
   * @returns 세션 정보 (submitId, startTime, savedAnswer
   */
  startOrResumeProbBookSession: async (
    probBookId: string,
    userId: string,
  ): Promise<ProbBookSubmitSession> => {
    // 진행 중인 세션 조회 (endTime이 null인 세션)
    const [existingSession] = await pgDb
      .select({
        id: probBookSubmitsTable.id,
        startTime: probBookSubmitsTable.startTime,
      })
      .from(probBookSubmitsTable)
      .where(
        and(
          eq(probBookSubmitsTable.probBookId, probBookId),
          eq(probBookSubmitsTable.ownerId, userId),
          isNull(probBookSubmitsTable.endTime),
        ),
      )
      .limit(1);

    let submitId: string;
    let startTime: Date;

    if (existingSession) {
      // 기존 세션 재개
      submitId = existingSession.id;
      startTime = existingSession.startTime;
    } else {
      // 새 세션 생성
      const [newSession] = await pgDb
        .insert(probBookSubmitsTable)
        .values({
          probBookId,
          ownerId: userId,
          startTime: new Date(),
        })
        .returning({
          id: probBookSubmitsTable.id,
          startTime: probBookSubmitsTable.startTime,
        });
      submitId = newSession.id;
      startTime = newSession.startTime;
    }

    // 저장된 답안 조회
    const savedAnswerRecords = await pgDb
      .select({
        blockId: probBlockAnswerSubmitsTable.blockId,
        answer: probBlockAnswerSubmitsTable.answer,
      })
      .from(probBlockAnswerSubmitsTable)
      .where(eq(probBlockAnswerSubmitsTable.submitId, submitId));

    const savedAnswers: Record<string, BlockAnswerSubmit> = {};
    for (const record of savedAnswerRecords) {
      savedAnswers[record.blockId] = record.answer;
    }

    return {
      submitId,
      startTime,
      savedAnswers,
    } as ProbBookSubmitSession;
  },

  /**
   * 답안 진행 상황 저장 (자동 저장)
   * @param submitId 세션 ID
   * @param answers 답안 목록 (blockId -> answer)
   */
  saveAnswerProgress: async (
    submitId: string,
    answers: Record<string, BlockAnswerSubmit>,
  ): Promise<void> => {
    const answerEntries = Object.entries(answers);

    if (answerEntries.length === 0) {
      return;
    }

    // upsert: composite primary key (blockId, submitId)로 중복 시 업데이트
    for (const [blockId, answer] of answerEntries) {
      await pgDb
        .insert(probBlockAnswerSubmitsTable)
        .values({
          blockId,
          submitId,
          answer,
          isCorrect: false, // 자동 저장 시에는 아직 채점 안 함
        })
        .onConflictDoUpdate({
          target: [
            probBlockAnswerSubmitsTable.blockId,
            probBlockAnswerSubmitsTable.submitId,
          ],
          set: {
            answer,
          },
        });
    }
  },

  /**
   * 문제집 세션 제출 및 채점
   * @param submitId 세션 ID
   * @param probBookId 문제집 ID
   * @param answers 최종 답안
   * @returns 제출 결과
   */
  submitProbBookSession: async (
    submitId: string,
    probBookId: string,
    answers: Record<string, BlockAnswerSubmit>,
  ): Promise<SubmitProbBookResponse> => {
    // 문제 목록 조회
    const probBlocks = await pgDb
      .select()
      .from(probBlocksTable)
      .where(eq(probBlocksTable.probBookId, probBookId));

    let score = 0;
    const correctAnswerIds: string[] = [];

    // 채점 및 답안 업데이트
    for (const block of probBlocks) {
      // 제출된 답안
      const submittedAnswer = answers[block.id];

      if (!submittedAnswer) {
        continue;
      }

      // 정답 여부 체크
      const isCorrect = All_BLOCKS[block.type].checkAnswer(
        block.answer,
        submittedAnswer,
      );

      // 정답 여부 체크 결과가 참이면 정답 리스트에 추가하고 점수 증가
      if (isCorrect) {
        correctAnswerIds.push(block.id);
        score++;
      }

      // 답안 제출 기록 업데이트
      await pgDb
        .insert(probBlockAnswerSubmitsTable)
        .values({
          blockId: block.id,
          submitId,
          answer: submittedAnswer,
          isCorrect,
        })
        .onConflictDoUpdate({
          target: [
            probBlockAnswerSubmitsTable.blockId,
            probBlockAnswerSubmitsTable.submitId,
          ],
          set: {
            answer: submittedAnswer,
            isCorrect,
          },
        });
    }

    // 세션 종료 (endTime, score 업데이트)
    await pgDb
      .update(probBookSubmitsTable)
      .set({
        endTime: new Date(),
        score,
      })
      .where(eq(probBookSubmitsTable.id, submitId));

    return {
      score: Math.round((score / probBlocks.length) * 100),
      correctAnswerIds,
      totalProblems: probBlocks.length,
      blockResults: probBlocks.map((block) => ({
        blockId: block.id,
        answer: block.answer,
      })),
    } as SubmitProbBookResponse;
  },

  deleteProbBookSession: async (
    probBookId: string,
    userId: string,
  ): Promise<void> => {
    await pgDb
      .delete(probBookSubmitsTable)
      .where(
        and(
          eq(probBookSubmitsTable.probBookId, probBookId),
          eq(probBookSubmitsTable.ownerId, userId),
          isNull(probBookSubmitsTable.endTime),
        ),
      );
  },

  hasProbBookSession: async (
    probBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [session] = await pgDb
      .select({
        id: probBookSubmitsTable.id,
      })
      .from(probBookSubmitsTable)
      .where(
        and(
          eq(probBookSubmitsTable.probBookId, probBookId),
          eq(probBookSubmitsTable.ownerId, userId),
          isNull(probBookSubmitsTable.endTime),
        ),
      )
      .limit(1);
    return session ? true : false;
  },
};
