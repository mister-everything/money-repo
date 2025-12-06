import { userTable } from "@service/auth";
import { PublicError } from "@workspace/error";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { pgDb } from "../db";
import { MAX_INPROGRESS_WORKBOOK_CREATE_COUNT } from "./block-config";
import { blockValidate } from "./block-validate";
import { BlockAnswerSubmit } from "./blocks";
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
  ReviewWorkBook,
  UpdateBlock,
  WorkBook,
  WorkBookBlock,
  WorkBookSolveCompleted,
  WorkBookSolveInProgress,
  WorkBookSubmitSession,
  WorkBookWithoutAnswer,
  WorkBookWithoutBlocks,
} from "./types";
import { checkAnswer, initialSubmitAnswer, isPublished } from "./utils";

const TagsSubQuery = pgDb
  .select({
    tags: sql<
      { id: number; name: string }[]
    >`json_agg(json_build_object('id', ${tagsTable.id}, 'name', ${tagsTable.name}))`,
  })
  .from(workBookTagsTable)
  .innerJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
  .where(eq(workBookTagsTable.workBookId, workBooksTable.id));

const WorkBookColumnsForList = {
  id: workBooksTable.id,
  title: workBooksTable.title,
  description: workBooksTable.description,
  isPublic: workBooksTable.isPublic,
  ownerName: userTable.name,
  ownerProfile: userTable.image,
  publishedAt: workBooksTable.publishedAt,
  tags: sql<
    { id: number; name: string }[]
  >`coalesce((${TagsSubQuery}), '[]'::json)`,
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

  checkEditPermission: async (workBookId: string, userId: string) => {
    const [workBook] = await pgDb
      .select({
        ownerId: workBooksTable.ownerId,
        publishedAt: workBooksTable.publishedAt,
      })
      .from(workBooksTable)
      .where(eq(workBooksTable.id, workBookId));
    if (!workBook) throw new PublicError("문제집을 찾을수 없습니다.");
    if (workBook?.ownerId !== userId)
      throw new PublicError("문제집에 권한이 없습니다.");
    if (isPublished(workBook))
      throw new PublicError("이미 배포된 문제집 입니다.");
  },

  searchMyWorkBooks: async (options: {
    userId: string;
    page?: number;
    limit?: number;
    isPublished?: boolean;
  }): Promise<WorkBookWithoutBlocks[]> => {
    const { userId, page = 1, limit = 100, isPublished } = options;
    const offset = (page - 1) * limit;

    const where = [eq(workBooksTable.ownerId, userId)];
    if (isPublished !== undefined) {
      where.push(
        isPublished
          ? isNotNull(workBooksTable.publishedAt)
          : isNull(workBooksTable.publishedAt),
      );
    }

    const rows = await pgDb
      .select(WorkBookColumnsForList)
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .where(and(...where))
      .offset(offset)
      .limit(limit)
      .orderBy(desc(workBooksTable.updatedAt));

    return rows;
  },

  /**
   * 공개된 문제집 목록 조회
   * @todo 검색옵션 추가 (pagination, 검색어, 태그, 퍼블릭 여부, owner,id )
   */
  async searchWorkBooks(options = {}): Promise<WorkBookWithoutBlocks[]> {
    const rows = await pgDb
      .select(WorkBookColumnsForList)
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id));

    return rows;
  },

  getWorkBook: async (
    id: string,
    options?: {
      isPublished?: boolean;
    },
  ): Promise<WorkBookWithoutBlocks | null> => {
    const where = [eq(workBooksTable.id, id)];
    if (options?.isPublished !== undefined) {
      where.push(
        options.isPublished
          ? isNotNull(workBooksTable.publishedAt)
          : isNull(workBooksTable.publishedAt),
      );
    }
    const [book] = await pgDb
      .select(WorkBookColumnsForList)
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .where(and(...where));

    if (!book) throw new PublicError("문제집을 찾을 수 없습니다.");
    return book;
  },
  getBlocks: async (workBookId: string): Promise<WorkBookBlock[]> => {
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
      .where(eq(blocksTable.workBookId, workBookId))
      .orderBy(blocksTable.order);
    return blocks.map((block) => ({
      id: block.id,
      content: block.content,
      question: block.question,
      order: block.order,
      type: block.type,
      answer: block.answer!,
    }));
  },
  publishWorkbook: async ({
    workBookId,
    userId,
    tags,
  }: {
    workBookId: string;
    userId: string;
    tags?: string[];
  }) => {
    await workBookService.checkEditPermission(workBookId, userId);
    const book = await workBookService.getWorkBookWithBlocks(workBookId);
    if (book?.title.trim() === "")
      throw new PublicError("문제집 제목을 입력해주세요.");
    if (book?.description?.trim() === "")
      throw new PublicError("문제집 설명을 입력해주세요.");
    if (!book) throw new PublicError("문제집을 찾을 수 없습니다.");
    if (!book.blocks.length) throw new PublicError("최소 1개이상의 문제 필요.");
    const isPublishAble = book.blocks
      .map(blockValidate)
      .every((r) => r.success);
    if (!isPublishAble) throw new PublicError("문제를 확인해보세요.");

    await pgDb.transaction(async (tx) => {
      if (tags?.length) {
        await tx
          .delete(workBookTagsTable)
          .where(eq(workBookTagsTable.workBookId, workBookId));

        // 태그 저장
        await tx
          .insert(tagsTable)
          .values(
            tags.map((tag) => ({
              name: tag,
              createdId: userId,
            })),
          )
          .onConflictDoNothing({
            target: [tagsTable.name],
          });
        const selectedTags = await tx
          .select({
            id: tagsTable.id,
          })
          .from(tagsTable)
          .where(inArray(tagsTable.name, tags));

        // 새 태그 저장
        await tx.insert(workBookTagsTable).values(
          selectedTags.map((tag) => ({
            workBookId,
            tagId: tag.id,
          })),
        );
      }
      await tx
        .update(workBooksTable)
        .set({
          publishedAt: new Date(),
        })
        .where(eq(workBooksTable.id, workBookId));
    });
  },

  getWorkBookWithoutAnswer: async (
    id: string,
    options?: {
      isPublished?: boolean;
    },
  ): Promise<WorkBookWithoutAnswer | null> => {
    const book = await workBookService.getWorkBook(id, options);
    if (!book) return null;
    const blocks = await workBookService.getBlocks(id);
    return {
      ...book,
      blocks: blocks.map((block) => ({
        ...block,
        answer: undefined,
      })),
    } as WorkBookWithoutAnswer;
  },

  // 문제집 조회 수정용
  getWorkBookWithBlocks: async (id: string): Promise<WorkBook | null> => {
    const book = await workBookService.getWorkBook(id);
    if (!book) return null;
    const blocks = await workBookService.getBlocks(id);
    return {
      ...book,
      blocks,
    };
  },

  isMaxInprogressWorkbookCreateCount: async (
    ownerId: string,
  ): Promise<boolean> => {
    const [inprogressWorkbook] = await pgDb
      .select({ count: count(workBooksTable.id) })
      .from(workBooksTable)
      .where(
        and(
          eq(workBooksTable.ownerId, ownerId),
          isNull(workBooksTable.publishedAt),
        ),
      );
    return inprogressWorkbook.count >= MAX_INPROGRESS_WORKBOOK_CREATE_COUNT;
  },

  /**
   * 문제집 생성
   */
  createWorkBook: async (workBook: CreateWorkBook): Promise<{ id: string }> => {
    const parsedWorkBook = createWorkBookSchema.parse(workBook);

    const isMaxInprogressWorkbookCreateCount =
      await workBookService.isMaxInprogressWorkbookCreateCount(
        workBook.ownerId,
      );

    if (isMaxInprogressWorkbookCreateCount)
      throw new PublicError(
        `최대 ${MAX_INPROGRESS_WORKBOOK_CREATE_COUNT}개의 문제집을 생성할 수 있습니다.`,
      );

    const data: typeof workBooksTable.$inferInsert = {
      ownerId: parsedWorkBook.ownerId,
      title: parsedWorkBook.title,
    };

    const [newWorkBook] = await pgDb
      .insert(workBooksTable)
      .values(data)
      .returning({ id: workBooksTable.id });
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
  processUpdateBlocks: async (
    bookId: string,
    {
      deleteBlocks,
      insertBlocks,
      updateBlocks,
    }: {
      deleteBlocks: string[];
      insertBlocks: WorkBookBlock[];
      updateBlocks: UpdateBlock[];
    },
  ): Promise<void> => {
    await pgDb.transaction(async (tx) => {
      if (insertBlocks.length > 0) {
        const insertResult = await tx
          .insert(blocksTable)
          .values(
            insertBlocks.map((block) => ({ ...block, workBookId: bookId })),
          );
        if (insertResult.rowCount !== insertBlocks.length) {
          throw new PublicError("Failed to insert blocks");
        }
      }
      if (updateBlocks.length > 0) {
        const updateQueries = updateBlocks.map(async (block) => {
          return await tx
            .update(blocksTable)
            .set(block)
            .where(eq(blocksTable.id, block.id));
        });
        await Promise.all(updateQueries);
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
          throw new PublicError("Failed to delete blocks");
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
    let isNewSession = false;
    const session: WorkBookSubmitSession = {
      submitId: "",
      startTime: new Date(),
      savedAnswers: {},
    };

    return pgDb.transaction(async (tx) => {
      const [existingSession] = await tx
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
        .orderBy(desc(workBookSubmitsTable.startTime))
        .limit(1);
      if (existingSession) {
        session.submitId = existingSession.id;
        session.startTime = existingSession.startTime;
      } else {
        isNewSession = true;
        const [newSession] = await tx
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
        session.submitId = newSession.id;
        session.startTime = newSession.startTime;
      }
      if (!isNewSession) {
        // 저장된 답안 조회
        const savedAnswerRecords = await tx
          .select({
            blockId: workBookBlockAnswerSubmitsTable.blockId,
            answer: workBookBlockAnswerSubmitsTable.answer,
          })
          .from(workBookBlockAnswerSubmitsTable)
          .where(
            eq(workBookBlockAnswerSubmitsTable.submitId, session.submitId),
          );

        const savedAnswers: Record<string, BlockAnswerSubmit> = {};
        for (const record of savedAnswerRecords) {
          savedAnswers[record.blockId] = record.answer;
        }
        session.savedAnswers = savedAnswers;
      }

      return session;
    });
  },

  /**
   * 답안 진행 상황 저장 (자동 저장)
   * @param submitId 세션 ID
   * @param answers 답안 목록 (blockId -> answer)
   */
  saveAnswerProgress: async (
    userId: string,
    submitId: string,
    answers: Record<string, BlockAnswerSubmit>,
  ): Promise<void> => {
    const answerEntries = Object.entries(answers);

    if (answerEntries.length === 0) {
      return;
    }

    const [session] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.id, submitId),
          eq(workBookSubmitsTable.ownerId, userId),
        ),
      );
    if (!session) {
      throw new PublicError("세션을 찾을 수 없습니다.");
    }

    await pgDb
      .insert(workBookBlockAnswerSubmitsTable)
      .values(
        answerEntries.map(([blockId, answer]) => ({
          blockId,
          submitId,
          answer,
          isCorrect: false, // 자동 저장 시에는 아직 채점 안 함
        })),
      )
      .onConflictDoUpdate({
        target: [
          workBookBlockAnswerSubmitsTable.blockId,
          workBookBlockAnswerSubmitsTable.submitId,
        ],
        set: {
          answer: sql`excluded.answer`,
        },
      });
  },

  /**
   * 문제집 세션 제출 및 채점
   * @param submitId 세션 ID
   * @param workBookId 문제집 ID
   * @param answers 최종 답안
   * @returns 제출 결과
   */
  submitWorkBookSession: async (
    userId: string,
    submitId: string,
  ): Promise<void> => {
    const [session] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
        workBookId: workBookSubmitsTable.workBookId,
        startTime: workBookSubmitsTable.startTime,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          isNull(workBookSubmitsTable.endTime),
          eq(workBookSubmitsTable.id, submitId),
          eq(workBookSubmitsTable.ownerId, userId),
        ),
      );

    if (!session) throw new PublicError("세션을 찾을 수 없습니다.");

    const blocks = await workBookService.getBlocks(session.workBookId);
    const submits = await pgDb
      .select({
        blockId: workBookBlockAnswerSubmitsTable.blockId,
        answer: workBookBlockAnswerSubmitsTable.answer,
      })
      .from(workBookBlockAnswerSubmitsTable)
      .where(eq(workBookBlockAnswerSubmitsTable.submitId, submitId));

    const submitByBlockId = submits.reduce(
      (acc, submit) => {
        acc[submit.blockId] = submit.answer;
        return acc;
      },
      {} as Record<string, BlockAnswerSubmit>,
    );

    return pgDb.transaction(async (tx) => {
      const saveSubmits = blocks.map((block) => {
        const submittedAnswer = submitByBlockId[block.id];
        const isCorrect = checkAnswer(block.answer, submittedAnswer);
        return {
          blockId: block.id,
          submitId,
          answer: submittedAnswer ?? initialSubmitAnswer(block.type),
          isCorrect,
        };
      });

      await tx
        .insert(workBookBlockAnswerSubmitsTable)
        .values(saveSubmits)
        .onConflictDoUpdate({
          target: [
            workBookBlockAnswerSubmitsTable.blockId,
            workBookBlockAnswerSubmitsTable.submitId,
          ],
          set: {
            answer: sql`excluded.answer`,
            isCorrect: sql`excluded.is_correct`,
          },
        });
      await tx
        .update(workBookSubmitsTable)
        .set({
          endTime: new Date(),
          blockCount: blocks.length,
        })
        .where(eq(workBookSubmitsTable.id, submitId));
    });
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
   * 풀고있는 문제집
   * @param userId 사용자 ID
   * @returns 풀고있는 문제집 목록
   */
  getSolveInProgress: async (
    userId: string,
  ): Promise<WorkBookSolveInProgress[]> => {
    const rows = await pgDb
      .select({
        ...WorkBookColumnsForList,
        startTime: workBookSubmitsTable.startTime,
      })
      .from(workBookSubmitsTable)
      .innerJoin(
        workBooksTable,
        eq(workBookSubmitsTable.workBookId, workBooksTable.id),
      )
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .where(
        and(
          eq(workBookSubmitsTable.ownerId, userId),
          isNull(workBookSubmitsTable.endTime),
        ),
      );

    return rows.map((row) => ({
      ...row,
      startTime: row.startTime,
    })) as WorkBookSolveInProgress[];
  },

  /**
   * 완료된 문제집 목록 조회
   * @param userId 사용자 ID
   * @returns 완료된 문제집 목록 (최신순, 문제집당 최신 기록 1개)
   */
  getCompletedWorkBooks: async (
    userId: string,
  ): Promise<WorkBookSolveCompleted[]> => {
    // 각 문제집별 최신 제출 ID 조회
    // 1단계: 각 문제집별 최신 제출 ID 조회 (Drizzle selectDistinctOn 사용)
    const latestSubmits = await pgDb
      .selectDistinctOn([workBookSubmitsTable.workBookId], {
        id: workBookSubmitsTable.id,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.ownerId, userId),
          isNotNull(workBookSubmitsTable.endTime),
        ),
      )
      .orderBy(
        workBookSubmitsTable.workBookId,
        desc(workBookSubmitsTable.endTime),
      );

    if (latestSubmits.length === 0) return [];

    const submitIds = latestSubmits.map((s) => s.id);

    // 2단계: 상세 정보 조회 (정답 개수 포함)
    const rows = await pgDb
      .select({
        id: workBooksTable.id,
        title: workBooksTable.title,
        description: workBooksTable.description,
        isPublic: workBooksTable.isPublic,
        publishedAt: workBooksTable.publishedAt,
        startTime: workBookSubmitsTable.startTime,
        endTime: workBookSubmitsTable.endTime,
        ownerName: userTable.name,
        ownerProfile: userTable.image,
        tags: sql<
          { id: number; name: string }[]
        >`coalesce(json_agg(distinct jsonb_build_object('id', ${tagsTable.id}, 'name', ${tagsTable.name})) filter (where ${tagsTable.name} is not null), '[]'::json)`,
        createdAt: workBooksTable.createdAt,
        totalProblems: sql<number>`count(distinct ${blocksTable.id})`,
        correctAnswerCount: sql<number>`count(distinct ${workBookBlockAnswerSubmitsTable.blockId}) filter (where ${workBookBlockAnswerSubmitsTable.isCorrect} = true)`,
      })
      .from(workBookSubmitsTable)
      .innerJoin(
        workBooksTable,
        eq(workBookSubmitsTable.workBookId, workBooksTable.id),
      )
      .innerJoin(blocksTable, eq(workBooksTable.id, blocksTable.workBookId))
      .leftJoin(
        workBookBlockAnswerSubmitsTable,
        eq(workBookBlockAnswerSubmitsTable.submitId, workBookSubmitsTable.id),
      )
      .leftJoin(
        workBookTagsTable,
        eq(workBookTagsTable.workBookId, workBooksTable.id),
      )
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .leftJoin(tagsTable, eq(workBookTagsTable.tagId, tagsTable.id))
      .where(inArray(workBookSubmitsTable.id, submitIds))
      .groupBy(
        workBooksTable.id,
        workBooksTable.title,
        workBooksTable.description,
        workBooksTable.isPublic,
        workBooksTable.createdAt,
        workBooksTable.publishedAt,
        workBookSubmitsTable.startTime,
        workBookSubmitsTable.endTime,
        userTable.name,
        userTable.image,
      )
      .orderBy(desc(workBookSubmitsTable.endTime));

    return rows.map((row) => ({
      ...row,
      startTime: row.startTime,
      endTime: row.endTime!,
      totalProblems: Number(row.totalProblems),
      correctAnswerCount: Number(row.correctAnswerCount),
    })) as WorkBookSolveCompleted[];
  },

  /**
   * 문제집 최신 결과 및 제출 답안 조회
   * @param workBookId 문제집 ID
   * @param userId 사용자 ID
   */
  async getLatestWorkBookWithAnswers(
    workbookId: string,
    userId: string,
  ): Promise<ReviewWorkBook | null> {
    const [session] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
        workBookId: workBookSubmitsTable.workBookId,
        startTime: workBookSubmitsTable.startTime,
        endTime: workBookSubmitsTable.endTime,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workbookId),
          eq(workBookSubmitsTable.ownerId, userId),
          isNotNull(workBookSubmitsTable.endTime),
        ),
      );

    console.log(session);
    if (!session) {
      return null;
    }

    const book = await workBookService.getWorkBookWithBlocks(
      session.workBookId,
    );

    if (!book) return null;

    // 문제 목록 및 정답 여부 조회
    const answers = await pgDb
      .select({
        blockId: workBookBlockAnswerSubmitsTable.blockId,
        isCorrect: workBookBlockAnswerSubmitsTable.isCorrect,
        answer: workBookBlockAnswerSubmitsTable.answer,
      })
      .from(workBookBlockAnswerSubmitsTable)
      .where(eq(workBookBlockAnswerSubmitsTable.submitId, session.id));

    console.log({
      ...book,
      correctAnswerCount: answers.filter((a) => a.isCorrect).length,
      totalProblems: book.blocks.length,
      startTime: session.startTime,
      endTime: session.endTime!,
      blocks: book?.blocks.map((block) => ({
        ...block,
        submit: answers.find((a) => a.blockId === block.id)?.answer,
      })),
    });
    return {
      ...book,
      correctAnswerCount: answers.filter((a) => a.isCorrect).length,
      totalProblems: book.blocks.length,
      startTime: session.startTime,
      endTime: session.endTime!,
      blocks: book?.blocks.map((block) => ({
        ...block,
        submit: answers.find((a) => a.blockId === block.id)?.answer,
      })),
    };
  },
};
