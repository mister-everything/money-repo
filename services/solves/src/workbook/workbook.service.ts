import { userTable } from "@service/auth";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { All_BLOCKS, BlockAnswerSubmit } from "./blocks";
import {
  blocksTable,
  probBlockAnswerSubmitsTable,
  probBookSubmitsTable,
  probBooksTable,
  probBookTagsTable,
  tagsTable,
} from "./schema";
import {
  CreateWorkBook,
  CreateWorkBookBlock,
  createWorkBookBlockSchema,
  createWorkBookSchema,
  SubmitWorkBookResponse,
  WorkBook,
  WorkBookBlock,
  WorkBookCompleted,
  WorkBookInProgress,
  WorkBookSubmitSession,
  WorkBookWithoutAnswer,
  WorkBookWithoutBlocks,
} from "./types";

export const workBookService = {
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

  /**
   * 공개된 문제집 목록 조회
   * @todo 검색옵션 추가 (pagination, 검색어, 태그, 퍼블릭 여부, owner,id )
   */
  async searchProbBooks(options = {}): Promise<WorkBookWithoutBlocks[]> {
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
        createdAt: probBooksTable.createdAt,
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
      createdAt: row.createdAt,
    }));
  },

  selectWorkBookWithoutAnswerById: async (
    id: string,
  ): Promise<WorkBookWithoutAnswer | null> => {
    const book = await workBookService.selectProbBookById(id);
    if (!book) return null;
    return {
      ...book,
      blocks: book.blocks.map((block) => ({
        ...block,
        answer: undefined,
      })),
    };
  },

  selectProbBookById: async (id: string): Promise<WorkBook | null> => {
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
        createdAt: probBooksTable.createdAt,
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
        id: blocksTable.id,
        content: blocksTable.content,
        question: blocksTable.question,
        answer: blocksTable.answer,
        order: blocksTable.order,
        type: blocksTable.type,
      })
      .from(blocksTable)
      .where(eq(blocksTable.probBookId, id));

    return {
      id: book.id,
      title: book.title,
      description: book.description ?? undefined,
      isPublic: book.isPublic,
      thumbnail: book.thumbnail ?? undefined,
      blocks: blocks.map((block) => ({
        id: block.id,
        content: block.content,
        question: block.question || "",
        order: block.order,
        type: block.type,
        answer: block.answer!,
      })),
      owner: {
        name: book.ownerName,
        profile: book.ownerProfile ?? undefined,
      },
      tags: book.tags ?? [],
      createdAt: book.createdAt,
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
  createWorkBook: async (probBook: CreateWorkBook): Promise<{ id: string }> => {
    const parsedProbBook = createWorkBookSchema.parse(probBook);
    const data: typeof probBooksTable.$inferInsert = {
      ownerId: parsedProbBook.ownerId,
      title: parsedProbBook.title,
    };

    const [newProbBook] = await pgDb
      .insert(probBooksTable)
      .values(data)
      .returning({ id: probBooksTable.id });

    // if (probBook.tags) {
    //   await workBookService.saveTagByBookId(newProbBook.id, probBook.tags);
    // }
    return newProbBook;
  },

  updateWorkBook: async (probBook: {
    id: string;
    title?: string;
    description?: string;
  }): Promise<void> => {
    await pgDb
      .update(probBooksTable)
      .set({
        title: probBook.title,
        description: probBook.description,
      })
      .where(eq(probBooksTable.id, probBook.id));
  },

  /**
   * 문제 생성
   */
  createWorkBookBlock: async (
    probBlock: CreateWorkBookBlock,
  ): Promise<WorkBookBlock> => {
    const parsedWorkBookBlock = createWorkBookBlockSchema.parse(probBlock);
    const data: typeof blocksTable.$inferInsert = {
      probBookId: parsedWorkBookBlock.probBookId,
      order: parsedWorkBookBlock.order,
      type: parsedWorkBookBlock.type,
      question: parsedWorkBookBlock.question,
      content: parsedWorkBookBlock.content,
      answer: parsedWorkBookBlock.answer,
    };

    const [newWorkBookBlock] = await pgDb
      .insert(blocksTable)
      .values(data)
      .returning({
        id: blocksTable.id,
        content: blocksTable.content,
        question: blocksTable.question,
        answer: blocksTable.answer,
        order: blocksTable.order,
        type: blocksTable.type,
      });

    return {
      id: newWorkBookBlock.id,
      type: newWorkBookBlock.type,
      content: newWorkBookBlock.content,
      question: newWorkBookBlock.question || "",
      answer: newWorkBookBlock.answer!,
      order: newWorkBookBlock.order,
    };
  },

  processBlocks: async (
    bookId: string,
    deleteBlocks: string[],
    saveBlocks: WorkBookBlock[],
  ): Promise<void> => {
    await pgDb.transaction(async (tx) => {
      if (saveBlocks.length > 0) {
        const saveResult = await tx
          .insert(blocksTable)
          .values(saveBlocks.map((block) => ({ ...block, probBookId: bookId })))
          .onConflictDoUpdate({
            target: [blocksTable.id],
            set: {
              answer: sql.raw(`excluded.${blocksTable.answer.name}`),
              content: sql.raw(`excluded.${blocksTable.content.name}`),
              question: sql.raw(`excluded.${blocksTable.question.name}`),
              order: sql.raw(`excluded.${blocksTable.order.name}`),
              type: sql.raw(`excluded.${blocksTable.type.name}`),
            },
          });
        if (saveResult.rowCount !== saveBlocks.length) {
          throw new Error("Failed to save blocks");
        }
      }
      if (deleteBlocks.length > 0) {
        const deleteResult = await tx
          .delete(blocksTable)
          .where(
            and(
              eq(blocksTable.probBookId, bookId),
              inArray(blocksTable.id, deleteBlocks),
            ),
          );
        if (deleteResult.rowCount !== deleteBlocks.length) {
          throw new Error("Failed to delete blocks");
        }
      }
    });
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
  ): Promise<WorkBookSubmitSession> => {
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
    } as WorkBookSubmitSession;
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
  ): Promise<SubmitWorkBookResponse> => {
    // 문제 목록 조회
    const probBlocks = await pgDb
      .select()
      .from(blocksTable)
      .where(eq(blocksTable.probBookId, probBookId));

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
    } as SubmitWorkBookResponse;
  },

  /**
   * 문제집 세션 삭제
   * @param submitId 세션 ID
   */
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

  /**
   * 문제집 세션 존재 여부 확인
   * @param probBookId 문제집 ID
   * @param userId 사용자 ID
   * @returns 세션 존재 여부
   */
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

  /**
   * 풀고있는 문제집
   * @param userId 사용자 ID
   * @returns 풀고있는 문제집 목록
   */
  getWorkBookInProgress: async (
    userId: string,
  ): Promise<WorkBookInProgress[]> => {
    const rows = await pgDb
      .select({
        id: probBooksTable.id,
        title: probBooksTable.title,
        description: probBooksTable.description,
        isPublic: probBooksTable.isPublic,
        thumbnail: probBooksTable.thumbnail,
        startTime: probBookSubmitsTable.startTime,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
        createdAt: probBooksTable.createdAt,
      })
      .from(probBookSubmitsTable)
      .innerJoin(
        probBooksTable,
        eq(probBookSubmitsTable.probBookId, probBooksTable.id),
      )
      .leftJoin(
        probBookTagsTable,
        eq(probBookTagsTable.probBookId, probBooksTable.id),
      )
      .innerJoin(userTable, eq(probBooksTable.ownerId, userTable.id))
      .leftJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(probBookSubmitsTable.ownerId, userId),
          isNull(probBookSubmitsTable.endTime),
        ),
      )
      .groupBy(
        probBooksTable.id,
        probBooksTable.title,
        probBooksTable.description,
        probBooksTable.isPublic,
        probBooksTable.thumbnail,
        probBooksTable.createdAt,
        probBookSubmitsTable.startTime,
        userTable.name,
        userTable.image,
      );

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: row.tags ?? [],
      isPublic: row.isPublic,
      thumbnail: row.thumbnail ?? undefined,
      owner: {
        name: row.ownerName,
        profile: row.ownerProfile ?? undefined,
      },
      createdAt: row.createdAt,
      startTime: row.startTime,
    })) as WorkBookInProgress[];
  },

  /**
   * 완료된 문제집 목록 조회
   * @param userId 사용자 ID
   * @returns 완료된 문제집 목록 (최신순, 문제집당 최신 기록 1개)
   */
  getCompletedProbBooks: async (
    userId: string,
  ): Promise<WorkBookCompleted[]> => {
    // 각 문제집별 최신 제출 ID 조회
    // 위 방식은 UUID라 위험함. Window function 사용
    const rows = await pgDb
      .select({
        id: probBooksTable.id,
        title: probBooksTable.title,
        description: probBooksTable.description,
        isPublic: probBooksTable.isPublic,
        thumbnail: probBooksTable.thumbnail,
        startTime: probBookSubmitsTable.startTime,
        endTime: probBookSubmitsTable.endTime,
        score: probBookSubmitsTable.score,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
        createdAt: probBooksTable.createdAt,
        totalProblems: sql<number>`count(distinct ${blocksTable.id})`,
      })
      .from(probBookSubmitsTable)
      .innerJoin(
        probBooksTable,
        eq(probBookSubmitsTable.probBookId, probBooksTable.id),
      )
      .innerJoin(blocksTable, eq(probBooksTable.id, blocksTable.probBookId))
      .leftJoin(
        probBookTagsTable,
        eq(probBookTagsTable.probBookId, probBooksTable.id),
      )
      .innerJoin(userTable, eq(probBooksTable.ownerId, userTable.id))
      .leftJoin(tagsTable, eq(probBookTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(probBookSubmitsTable.ownerId, userId),
          sql`${probBookSubmitsTable.endTime} is not null`,
          // 최신 제출만 필터링하는 조건이 필요함.
          // 복잡해지므로 쿼리를 분리하거나 distinct on을 사용
          inArray(
            probBookSubmitsTable.id,
            pgDb
              .select({
                id: sql<string>`distinct on (${probBookSubmitsTable.probBookId}) ${probBookSubmitsTable.id}`,
              })
              .from(probBookSubmitsTable)
              .where(
                and(
                  eq(probBookSubmitsTable.ownerId, userId),
                  sql`${probBookSubmitsTable.endTime} is not null`,
                ),
              )
              .orderBy(
                probBookSubmitsTable.probBookId,
                sql`${probBookSubmitsTable.endTime} desc`,
              ),
          ),
        ),
      )
      .groupBy(
        probBooksTable.id,
        probBooksTable.title,
        probBooksTable.description,
        probBooksTable.isPublic,
        probBooksTable.thumbnail,
        probBooksTable.createdAt,
        probBookSubmitsTable.startTime,
        probBookSubmitsTable.endTime,
        probBookSubmitsTable.score,
        userTable.name,
        userTable.image,
      )
      .orderBy(sql`${probBookSubmitsTable.endTime} desc`);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: row.tags ?? [],
      isPublic: row.isPublic,
      thumbnail: row.thumbnail ?? undefined,
      owner: {
        name: row.ownerName,
        profile: row.ownerProfile ?? undefined,
      },
      createdAt: row.createdAt,
      startTime: row.startTime,
      endTime: row.endTime!,
      score: row.score,
      totalProblems: Number(row.totalProblems),
    })) as WorkBookCompleted[];
  },

  /**
   * 문제집 최신 결과 조회
   * @param probBookId 문제집 ID
   * @param userId 사용자 ID
   */
  getLatestProbBookResult: async (
    probBookId: string,
    userId: string,
  ): Promise<SubmitWorkBookResponse | null> => {
    // 최신 제출 세션 조회
    const [session] = await pgDb
      .select({
        id: probBookSubmitsTable.id,
        score: probBookSubmitsTable.score,
      })
      .from(probBookSubmitsTable)
      .where(
        and(
          eq(probBookSubmitsTable.probBookId, probBookId),
          eq(probBookSubmitsTable.ownerId, userId),
          sql`${probBookSubmitsTable.endTime} is not null`,
        ),
      )
      .orderBy(sql`${probBookSubmitsTable.endTime} desc`)
      .limit(1);

    if (!session) {
      return null;
    }

    // 문제 목록 및 정답 여부 조회
    const answers = await pgDb
      .select({
        blockId: probBlockAnswerSubmitsTable.blockId,
        isCorrect: probBlockAnswerSubmitsTable.isCorrect,
        answer: probBlockAnswerSubmitsTable.answer,
      })
      .from(probBlockAnswerSubmitsTable)
      .where(eq(probBlockAnswerSubmitsTable.submitId, session.id));

    // 전체 문제 수 조회
    const [totalCount] = await pgDb
      .select({
        count: sql<number>`count(*)`,
      })
      .from(blocksTable)
      .where(eq(blocksTable.probBookId, probBookId));

    const correctAnswerIds = answers
      .filter((a) => a.isCorrect)
      .map((a) => a.blockId);

    // 블록별 정답 데이터 구성 (클라이언트에서 보여줄 때 필요)
    // 원래 정답은 보안상 클라이언트에 주면 안되지만, 결과 화면에서는 보여줘야 할 수도 있음.
    // 여기서는 사용자가 제출한 답과 정답 여부만 내려주고,
    // 실제 정답 데이터는 workBookService.selectProbBookById 에서 가져온 블록 정보에는 answer가 포함되어 있지 않음 (풀이 모드라).
    // 결과 모드에서는 정답을 보여줘야 한다면 selectProbBookById를 수정하거나 별도 로직 필요.
    // 일단 SubmitWorkBookResponse 타입에 맞춰서 반환.

    // 문제집의 정답 데이터 조회
    const blocks = await pgDb
      .select({
        id: blocksTable.id,
        answer: blocksTable.answer,
      })
      .from(blocksTable)
      .where(eq(blocksTable.probBookId, probBookId));

    const blockResults = blocks.map((block) => ({
      blockId: block.id,
      answer: block.answer,
    }));

    return {
      score: session.score,
      correctAnswerIds,
      totalProblems: Number(totalCount.count),
      blockResults,
    } as SubmitWorkBookResponse;
  },
};
