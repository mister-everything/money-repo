import { userTable } from "@service/auth";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { All_BLOCKS, BlockAnswerSubmit } from "./blocks";
import {
  blocksTable,
  tagsTable,
  workBookBlockAnswerSubmitsTable,
  workBookSubmitsTable,
  workBooksTable,
  workBookTagsTable,
} from "./schema";
import {
  CreateWorkBook,
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

const tagsSubQuery = pgDb
  .select({
    tags: sql<string[]>`array_agg(${tagsTable.name})`,
  })
  .from(workBookTagsTable)
  .innerJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
  .where(eq(workBookTagsTable.workBookId, workBooksTable.id))
  .toSQL();

const WorkBookColumnsForList = {
  id: workBooksTable.id,
  title: workBooksTable.title,
  description: workBooksTable.description,
  isPublic: workBooksTable.isPublic,
  thumbnail: workBooksTable.thumbnail,
  ownerName: userTable.name,
  ownerProfile: userTable.image,
  tags: sql<string[]>`coalesce((${tagsSubQuery}), '{}')`,
  createdAt: workBooksTable.createdAt,
};

export const workBookService = {
  isWorkBookOwner: async (
    workBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [workBook] = await pgDb
      .select({
        ownerId: workBooksTable.ownerId,
      })
      .from(workBooksTable)
      .where(eq(workBooksTable.id, workBookId));
    return workBook?.ownerId === userId;
  },

  searchMyWorkBooks: async (options: {
    userId: string;
    page?: number;
    limit?: number;
    isPublic?: boolean;
  }): Promise<WorkBookWithoutBlocks[]> => {
    const { userId, page = 1, limit = 100, isPublic } = options;
    const offset = (page - 1) * limit;

    const where = [eq(workBooksTable.ownerId, userId)];
    if (isPublic !== undefined) {
      where.push(eq(workBooksTable.isPublic, isPublic));
    }

    const query = pgDb
      .select(WorkBookColumnsForList)
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .where(and(...where))
      .offset(offset)
      .limit(limit)
      .orderBy(sql`${workBooksTable.createdAt} desc`);

    const rows = await query;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      tags: row.tags,
      isPublic: row.isPublic,
      owner: {
        name: row.ownerName,
        profile: row.ownerProfile ?? undefined,
      },
      thumbnail: row.thumbnail ?? undefined,
      createdAt: row.createdAt,
    }));
  },

  /**
   * 공개된 문제집 목록 조회
   * @todo 검색옵션 추가 (pagination, 검색어, 태그, 퍼블릭 여부, owner,id )
   */
  async searchWorkBooks(options = {}): Promise<WorkBookWithoutBlocks[]> {
    const rows = await pgDb
      .select({
        id: workBooksTable.id,
        title: workBooksTable.title,
        description: workBooksTable.description,
        isPublic: workBooksTable.isPublic,
        thumbnail: workBooksTable.thumbnail,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
        createdAt: workBooksTable.createdAt,
      })
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .leftJoin(
        workBookTagsTable,
        eq(workBooksTable.id, workBookTagsTable.workBookId),
      )
      .leftJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
      .groupBy(workBooksTable.id, userTable.id);

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
    const book = await workBookService.selectWorkBookById(id);
    if (!book) return null;
    return {
      ...book,
      blocks: book.blocks.map((block) => ({
        ...block,
        answer: undefined,
      })),
    };
  },

  selectWorkBookById: async (id: string): Promise<WorkBook | null> => {
    const [book] = await pgDb
      .select({
        id: workBooksTable.id,
        title: workBooksTable.title,
        description: workBooksTable.description,
        isPublic: workBooksTable.isPublic,
        thumbnail: workBooksTable.thumbnail,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
        createdAt: workBooksTable.createdAt,
      })
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .leftJoin(
        workBookTagsTable,
        eq(workBooksTable.id, workBookTagsTable.workBookId),
      )
      .leftJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
      .where(eq(workBooksTable.id, id))
      .groupBy(workBooksTable.id, userTable.id);

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
      .where(eq(blocksTable.workBookId, id));

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
      .delete(workBookTagsTable)
      .where(eq(workBookTagsTable.workBookId, bookId));

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
    await pgDb.insert(workBookTagsTable).values(
      selectedTags.map((tag) => ({
        workBookId: bookId,
        tagId: tag.id,
      })),
    );
  },

  /**
   * 문제집 생성
   */
  createWorkBook: async (workBook: CreateWorkBook): Promise<{ id: string }> => {
    const parsedWorkBook = createWorkBookSchema.parse(workBook);
    const data: typeof workBooksTable.$inferInsert = {
      ownerId: parsedWorkBook.ownerId,
      title: parsedWorkBook.title,
    };

    const [newWorkBook] = await pgDb
      .insert(workBooksTable)
      .values(data)
      .returning({ id: workBooksTable.id });

    // if (workBook.tags) {
    //   await workBookService.saveTagByBookId(newWorkBook.id, workBook.tags);
    // }
    return newWorkBook;
  },

  updateWorkBook: async (workBook: {
    id: string;
    title?: string;
    description?: string;
  }): Promise<void> => {
    await pgDb
      .update(workBooksTable)
      .set({
        title: workBook.title,
        description: workBook.description,
      })
      .where(eq(workBooksTable.id, workBook.id));
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
          .values(saveBlocks.map((block) => ({ ...block, workBookId: bookId })))
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
              eq(blocksTable.workBookId, bookId),
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
   * @param workBookId 문제집 I
   * @param userId 사용자 ID
   * @returns 세션 정보 (submitId, startTime, savedAnswer
   */
  startOrResumeWorkBookSession: async (
    workBookId: string,
    userId: string,
  ): Promise<WorkBookSubmitSession> => {
    // 진행 중인 세션 조회 (endTime이 null인 세션)
    const [existingSession] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
        startTime: workBookSubmitsTable.startTime,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
          isNull(workBookSubmitsTable.endTime),
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
        .insert(workBookSubmitsTable)
        .values({
          workBookId,
          ownerId: userId,
          startTime: new Date(),
        })
        .returning({
          id: workBookSubmitsTable.id,
          startTime: workBookSubmitsTable.startTime,
        });
      submitId = newSession.id;
      startTime = newSession.startTime;
    }

    // 저장된 답안 조회
    const savedAnswerRecords = await pgDb
      .select({
        blockId: workBookBlockAnswerSubmitsTable.blockId,
        answer: workBookBlockAnswerSubmitsTable.answer,
      })
      .from(workBookBlockAnswerSubmitsTable)
      .where(eq(workBookBlockAnswerSubmitsTable.submitId, submitId));

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
        .insert(workBookBlockAnswerSubmitsTable)
        .values({
          blockId,
          submitId,
          answer,
          isCorrect: false, // 자동 저장 시에는 아직 채점 안 함
        })
        .onConflictDoUpdate({
          target: [
            workBookBlockAnswerSubmitsTable.blockId,
            workBookBlockAnswerSubmitsTable.submitId,
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
   * @param workBookId 문제집 ID
   * @param answers 최종 답안
   * @returns 제출 결과
   */
  submitWorkBookSession: async (
    submitId: string,
    workBookId: string,
    answers: Record<string, BlockAnswerSubmit>,
  ): Promise<SubmitWorkBookResponse> => {
    // 문제 목록 조회
    const workBookBlocks = await pgDb
      .select()
      .from(blocksTable)
      .where(eq(blocksTable.workBookId, workBookId));

    let score = 0;
    const correctAnswerIds: string[] = [];

    // 채점 및 답안 업데이트
    for (const block of workBookBlocks) {
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
        .insert(workBookBlockAnswerSubmitsTable)
        .values({
          blockId: block.id,
          submitId,
          answer: submittedAnswer,
          isCorrect,
        })
        .onConflictDoUpdate({
          target: [
            workBookBlockAnswerSubmitsTable.blockId,
            workBookBlockAnswerSubmitsTable.submitId,
          ],
          set: {
            answer: submittedAnswer,
            isCorrect,
          },
        });
    }

    // 세션 종료 (endTime, score 업데이트)
    await pgDb
      .update(workBookSubmitsTable)
      .set({
        endTime: new Date(),
        score,
      })
      .where(eq(workBookSubmitsTable.id, submitId));

    return {
      score: Math.round((score / workBookBlocks.length) * 100),
      correctAnswerIds,
      totalProblems: workBookBlocks.length,
      blockResults: workBookBlocks.map((block) => ({
        blockId: block.id,
        answer: block.answer,
      })),
    } as SubmitWorkBookResponse;
  },

  /**
   * 문제집 세션 삭제
   * @param submitId 세션 ID
   */
  deleteWorkBookSession: async (
    workBookId: string,
    userId: string,
  ): Promise<void> => {
    await pgDb
      .delete(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
          isNull(workBookSubmitsTable.endTime),
        ),
      );
  },

  /**
   * 문제집 세션 존재 여부 확인
   * @param workBookId 문제집 ID
   * @param userId 사용자 ID
   * @returns 세션 존재 여부
   */
  hasWorkBookSession: async (
    workBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [session] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
          isNull(workBookSubmitsTable.endTime),
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
        id: workBooksTable.id,
        title: workBooksTable.title,
        description: workBooksTable.description,
        isPublic: workBooksTable.isPublic,
        thumbnail: workBooksTable.thumbnail,
        startTime: workBookSubmitsTable.startTime,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
        createdAt: workBooksTable.createdAt,
      })
      .from(workBookSubmitsTable)
      .innerJoin(
        workBooksTable,
        eq(workBookSubmitsTable.workBookId, workBooksTable.id),
      )
      .leftJoin(
        workBookTagsTable,
        eq(workBookTagsTable.workBookId, workBooksTable.id),
      )
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .leftJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(workBookSubmitsTable.ownerId, userId),
          isNull(workBookSubmitsTable.endTime),
        ),
      )
      .groupBy(
        workBooksTable.id,
        workBooksTable.title,
        workBooksTable.description,
        workBooksTable.isPublic,
        workBooksTable.thumbnail,
        workBooksTable.createdAt,
        workBookSubmitsTable.startTime,
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
  getCompletedWorkBooks: async (
    userId: string,
  ): Promise<WorkBookCompleted[]> => {
    // 각 문제집별 최신 제출 ID 조회
    // 위 방식은 UUID라 위험함. Window function 사용
    const rows = await pgDb
      .select({
        id: workBooksTable.id,
        title: workBooksTable.title,
        description: workBooksTable.description,
        isPublic: workBooksTable.isPublic,
        thumbnail: workBooksTable.thumbnail,
        startTime: workBookSubmitsTable.startTime,
        endTime: workBookSubmitsTable.endTime,
        score: workBookSubmitsTable.score,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          string[]
        >`coalesce(array_agg(${tagsTable.name}) filter (where ${tagsTable.name} is not null), '{}')`,
        createdAt: workBooksTable.createdAt,
        totalProblems: sql<number>`count(distinct ${blocksTable.id})`,
      })
      .from(workBookSubmitsTable)
      .innerJoin(
        workBooksTable,
        eq(workBookSubmitsTable.workBookId, workBooksTable.id),
      )
      .innerJoin(blocksTable, eq(workBooksTable.id, blocksTable.workBookId))
      .leftJoin(
        workBookTagsTable,
        eq(workBookTagsTable.workBookId, workBooksTable.id),
      )
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .leftJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
      .where(
        and(
          eq(workBookSubmitsTable.ownerId, userId),
          sql`${workBookSubmitsTable.endTime} is not null`,
          // 최신 제출만 필터링하는 조건이 필요함.
          // 복잡해지므로 쿼리를 분리하거나 distinct on을 사용
          inArray(
            workBookSubmitsTable.id,
            pgDb
              .select({
                id: sql<string>`distinct on (${workBookSubmitsTable.workBookId}) ${workBookSubmitsTable.id}`,
              })
              .from(workBookSubmitsTable)
              .where(
                and(
                  eq(workBookSubmitsTable.ownerId, userId),
                  sql`${workBookSubmitsTable.endTime} is not null`,
                ),
              )
              .orderBy(
                workBookSubmitsTable.workBookId,
                sql`${workBookSubmitsTable.endTime} desc`,
              ),
          ),
        ),
      )
      .groupBy(
        workBooksTable.id,
        workBooksTable.title,
        workBooksTable.description,
        workBooksTable.isPublic,
        workBooksTable.thumbnail,
        workBooksTable.createdAt,
        workBookSubmitsTable.startTime,
        workBookSubmitsTable.endTime,
        workBookSubmitsTable.score,
        userTable.name,
        userTable.image,
      )
      .orderBy(sql`${workBookSubmitsTable.endTime} desc`);

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
   * @param workBookId 문제집 ID
   * @param userId 사용자 ID
   */
  getLatestWorkBookResult: async (
    workBookId: string,
    userId: string,
  ): Promise<SubmitWorkBookResponse | null> => {
    // 최신 제출 세션 조회
    const [session] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
        score: workBookSubmitsTable.score,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
          sql`${workBookSubmitsTable.endTime} is not null`,
        ),
      )
      .orderBy(sql`${workBookSubmitsTable.endTime} desc`)
      .limit(1);

    if (!session) {
      return null;
    }

    // 문제 목록 및 정답 여부 조회
    const answers = await pgDb
      .select({
        blockId: workBookBlockAnswerSubmitsTable.blockId,
        isCorrect: workBookBlockAnswerSubmitsTable.isCorrect,
        answer: workBookBlockAnswerSubmitsTable.answer,
      })
      .from(workBookBlockAnswerSubmitsTable)
      .where(eq(workBookBlockAnswerSubmitsTable.submitId, session.id));

    // 전체 문제 수 조회
    const [totalCount] = await pgDb
      .select({
        count: sql<number>`count(*)`,
      })
      .from(blocksTable)
      .where(eq(blocksTable.workBookId, workBookId));

    const correctAnswerIds = answers
      .filter((a) => a.isCorrect)
      .map((a) => a.blockId);

    // 블록별 정답 데이터 구성 (클라이언트에서 보여줄 때 필요)
    // 원래 정답은 보안상 클라이언트에 주면 안되지만, 결과 화면에서는 보여줘야 할 수도 있음.
    // 여기서는 사용자가 제출한 답과 정답 여부만 내려주고,
    // 실제 정답 데이터는 workBookService.selectWorkBookById 에서 가져온 블록 정보에는 answer가 포함되어 있지 않음 (풀이 모드라).
    // 결과 모드에서는 정답을 보여줘야 한다면 selectWorkBookById를 수정하거나 별도 로직 필요.
    // 일단 SubmitWorkBookResponse 타입에 맞춰서 반환.

    // 문제집의 정답 데이터 조회
    const blocks = await pgDb
      .select({
        id: blocksTable.id,
        answer: blocksTable.answer,
      })
      .from(blocksTable)
      .where(eq(blocksTable.workBookId, workBookId));

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
