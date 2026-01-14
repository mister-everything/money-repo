import { userTable } from "@service/auth";
import { Role } from "@service/auth/shared";
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
import { chatService } from "../chat/chat.service";
import { MAX_INPROGRESS_WORKBOOK_CREATE_COUNT } from "./block-config";
import { blockValidate } from "./block-validate";
import { BlockAnswer, BlockAnswerSubmit } from "./blocks";
import {
  blocksTable,
  tagsTable,
  WorkBookLikes,
  workBookBlockAnswerSubmitsTable,
  workBookSubmitsTable,
  workBooksTable,
  workBookTagsTable,
  workBookUserFirstScoresTable,
} from "./schema";
import {
  SessionInProgress,
  SessionStatus,
  SessionSubmitted,
  UpdateBlock,
  WorkBook,
  WorkBookBlock,
  WorkBookReviewSession,
  WorkBookSession,
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
  ownerName: userTable.nickname,
  ownerProfile: userTable.image,
  ownerPublicId: userTable.publicId,
  isAdmin: sql<boolean>`${userTable.role} = ${Role.ADMIN}`,
  publishedAt: workBooksTable.publishedAt,
  tags: sql<
    { id: number; name: string }[]
  >`coalesce((${TagsSubQuery}), '[]'::json)`,
  createdAt: workBooksTable.createdAt,
  likeCount: workBooksTable.likeCount,
  firstSolverCount: workBooksTable.firstSolverCount,
  firstScoreSum: workBooksTable.firstScoreSum,
  categoryId: workBooksTable.categoryId,
};

type GetWorkBookOptions = {
  isPublished?: boolean;
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
      .where(
        and(
          eq(workBooksTable.id, workBookId),
          isNull(workBooksTable.deletedAt),
        ),
      );
    if (!workBook) throw new PublicError("문제집을 찾을수 없습니다.");
    if (workBook?.ownerId !== userId)
      throw new PublicError("문제집에 권한이 없습니다.");
    if (isPublished(workBook))
      throw new PublicError("이미 배포된 문제집 입니다.");
  },

  deleteWorkBook: async (workBookId: string): Promise<void> => {
    await chatService.deleteThreadsByWorkbookId(workBookId);
    await pgDb.delete(workBooksTable).where(eq(workBooksTable.id, workBookId));
  },
  softDeleteWorkBook: async (
    workBookId: string,
    reason?: string,
  ): Promise<void> => {
    await pgDb
      .update(workBooksTable)
      .set({
        deletedAt: new Date(),
        deletedReason: reason,
      })
      .where(eq(workBooksTable.id, workBookId));
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
      .where(and(...where, isNull(workBooksTable.deletedAt)))
      .offset(offset)
      .limit(limit)
      .orderBy(desc(workBooksTable.updatedAt));

    return rows;
  },

  /**
   * 공개된 문제집 목록 조회
   * @todo 검색옵션 추가 (pagination, 검색어, 태그, 퍼블릭 여부, owner,id )
   */
  async searchWorkBooks(options?: {
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }): Promise<WorkBookWithoutBlocks[]> {
    const { isPublished, page = 1, limit = 100 } = options ?? {};
    const offset = (page - 1) * limit;

    const where = [eq(workBooksTable.isPublic, true)];
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
      .where(and(...where, isNull(workBooksTable.deletedAt)))
      .offset(offset)
      .limit(limit)
      .orderBy(desc(workBooksTable.updatedAt));

    return rows;
  },

  getWorkBook: async (
    id: string,
    options?: GetWorkBookOptions,
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
      .where(and(...where, isNull(workBooksTable.deletedAt)));

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
    return blocks as WorkBookBlock[];
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
    options?: GetWorkBookOptions,
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
  getWorkBookWithBlocks: async (
    id: string,
    options?: GetWorkBookOptions,
  ): Promise<WorkBook | null> => {
    const book = await workBookService.getWorkBook(id, options);
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
  createWorkBook: async (workBook: {
    ownerId: string;
    title: string;
    categoryId?: number;
  }): Promise<{ id: string }> => {
    const isMaxInprogressWorkbookCreateCount =
      await workBookService.isMaxInprogressWorkbookCreateCount(
        workBook.ownerId,
      );

    if (isMaxInprogressWorkbookCreateCount)
      throw new PublicError(
        `최대 ${MAX_INPROGRESS_WORKBOOK_CREATE_COUNT}개의 문제집을 생성할 수 있습니다.`,
      );

    const data: typeof workBooksTable.$inferInsert = {
      ownerId: workBook.ownerId,
      title: workBook.title,
      categoryId: workBook.categoryId,
    };

    const [newWorkBook] = await pgDb
      .insert(workBooksTable)
      .values(data)
      .returning({ id: workBooksTable.id });

    return newWorkBook;
  },

  copyWorkBook: async ({
    workBookId,
    userId,
  }: {
    workBookId: string;
    userId: string;
  }): Promise<{ id: string }> => {
    const [origin] = await pgDb
      .select({
        id: workBooksTable.id,
        ownerId: workBooksTable.ownerId,
        title: workBooksTable.title,
        description: workBooksTable.description,
        isPublic: workBooksTable.isPublic,
        categoryId: workBooksTable.categoryId,
      })
      .from(workBooksTable)
      .where(
        and(
          eq(workBooksTable.id, workBookId),
          isNull(workBooksTable.deletedAt),
        ),
      );

    if (!origin) throw new PublicError("문제집을 찾을 수 없습니다.");
    if (origin.ownerId !== userId)
      throw new PublicError("문제집 복사 권한이 없습니다.");

    return pgDb.transaction(async (tx) => {
      const [created] = await tx
        .insert(workBooksTable)
        .values({
          ownerId: userId,
          title: `복사본 - ${origin.title ?? ""}`.trim().slice(0, 20),
          description: origin.description,
          isPublic: origin.isPublic,
          publishedAt: null,
          likeCount: 0,
          firstScoreSum: 0,
          firstSolverCount: 0,
          categoryId: origin.categoryId,
        })
        .returning({ id: workBooksTable.id });

      const newWorkBookId = created.id;

      const blocks = await tx
        .select({
          order: blocksTable.order,
          type: blocksTable.type,
          question: blocksTable.question,
          content: blocksTable.content,
          answer: blocksTable.answer,
        })
        .from(blocksTable)
        .where(eq(blocksTable.workBookId, workBookId))
        .orderBy(blocksTable.order);

      if (blocks.length > 0) {
        await tx.insert(blocksTable).values(
          blocks.map((b) => ({
            workBookId: newWorkBookId,
            order: b.order,
            type: b.type,
            question: b.question,
            content: b.content,
            answer: b.answer,
          })),
        );
      }

      return { id: newWorkBookId };
    });
  },

  toggleWorkBookPublic: async ({
    workBookId,
    userId,
    isPublic,
  }: {
    workBookId: string;
    userId: string;
    isPublic: boolean;
  }): Promise<void> => {
    const result = await pgDb
      .update(workBooksTable)
      .set({
        isPublic,
      })
      .where(
        and(
          eq(workBooksTable.id, workBookId),
          eq(workBooksTable.ownerId, userId),
          isNull(workBooksTable.deletedAt),
        ),
      );
    if (result.rowCount === 0) {
      throw new PublicError("문제집을 찾을 수 없습니다.");
    }
  },

  updateWorkBookCategory: async ({
    workBookId,
    categoryId,
  }: {
    workBookId: string;
    categoryId: number;
  }) => {
    await pgDb
      .update(workBooksTable)
      .set({
        categoryId,
      })
      .where(
        and(
          eq(workBooksTable.id, workBookId),
          isNull(workBooksTable.deletedAt),
        ),
      );
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
      .where(
        and(
          eq(workBooksTable.id, workBook.id),
          isNull(workBooksTable.deletedAt),
        ),
      );
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
  ): Promise<{
    session: SessionInProgress;
    isNewSession: boolean;
  }> => {
    const session: SessionInProgress = {
      status: "in-progress",
      submitId: "",
      startTime: new Date(),
    };
    let isNewSession = false;

    return pgDb.transaction(async (tx) => {
      const [existingSession] = await tx
        .select({
          id: workBookSubmitsTable.id,
          startTime: workBookSubmitsTable.startTime,
        })
        .from(workBookSubmitsTable)
        .innerJoin(
          workBooksTable,
          eq(workBookSubmitsTable.workBookId, workBooksTable.id),
        )
        .where(
          and(
            eq(workBookSubmitsTable.workBookId, workBookId),
            eq(workBookSubmitsTable.ownerId, userId),
            isNull(workBookSubmitsTable.endTime),
            eq(workBookSubmitsTable.active, true),
          ),
        )
        .orderBy(desc(workBookSubmitsTable.startTime))
        .limit(1);
      if (existingSession) {
        session.submitId = existingSession.id;
        session.startTime = existingSession.startTime;
      } else {
        isNewSession = true;

        await tx
          .update(workBookSubmitsTable)
          .set({ active: false })
          .where(
            and(
              eq(workBookSubmitsTable.workBookId, workBookId),
              eq(workBookSubmitsTable.ownerId, userId),
            ),
          );

        const [row] = await tx
          .select({
            blockCount: count(blocksTable.id),
          })
          .from(blocksTable)
          .where(eq(blocksTable.workBookId, workBookId));

        const [newSession] = await tx
          .insert(workBookSubmitsTable)
          .values({
            workBookId,
            ownerId: userId,
            startTime: new Date(),
            active: true,
            blockCount: row.blockCount,
            correctBlocks: 0,
          })
          .returning({
            id: workBookSubmitsTable.id,
            startTime: workBookSubmitsTable.startTime,
          });

        session.submitId = newSession.id;
        session.startTime = newSession.startTime;
      }
      return {
        session,
        isNewSession,
      };
    });
  },

  resetWorkBookSession: async ({
    userId,
    submitId,
  }: {
    userId: string;
    submitId: string;
  }): Promise<void> => {
    return pgDb.transaction(async (tx) => {
      const result = await tx
        .update(workBookSubmitsTable)
        .set({
          startTime: new Date(),
          endTime: null,
        })
        .where(
          and(
            eq(workBookSubmitsTable.id, submitId),
            eq(workBookSubmitsTable.ownerId, userId),
            eq(workBookSubmitsTable.active, true),
          ),
        );
      if (result.rowCount === 0) {
        throw new PublicError("세션을 찾을 수 없습니다.");
      }
      await tx
        .delete(workBookBlockAnswerSubmitsTable)
        .where(and(eq(workBookBlockAnswerSubmitsTable.submitId, submitId)));
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
    {
      answers,
      deleteAnswers,
    }: {
      answers: Record<string, BlockAnswerSubmit>;
      deleteAnswers: string[];
    },
  ): Promise<void> => {
    const [session] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.id, submitId),
          eq(workBookSubmitsTable.ownerId, userId),
          eq(workBookSubmitsTable.active, true),
        ),
      );
    if (!session) {
      throw new PublicError("세션을 찾을 수 없습니다.");
    }

    return pgDb.transaction(async (tx) => {
      if (deleteAnswers.length > 0) {
        await tx
          .delete(workBookBlockAnswerSubmitsTable)
          .where(
            inArray(workBookBlockAnswerSubmitsTable.blockId, deleteAnswers),
          );
      }
      const answerEntries = Object.entries(answers);

      if (answerEntries.length > 0) {
        await tx
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
      }
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
    return pgDb.transaction(async (tx) => {
      const locked = await tx.execute<{
        workBookId: string;
        endTime: Date | null;
      }>(sql`
        SELECT
          ${workBookSubmitsTable.workBookId} as "workBookId",
          ${workBookSubmitsTable.endTime} as "endTime"
        FROM ${workBookSubmitsTable}
        WHERE ${workBookSubmitsTable.id} = ${submitId}
          AND ${workBookSubmitsTable.ownerId} = ${userId}
        FOR UPDATE
      `);

      const session = locked.rows[0];
      if (!session) throw new PublicError("세션을 찾을 수 없습니다.");
      if (session.endTime) throw new PublicError("이미 제출된 세션 입니다.");

      const blocks = await tx
        .select({
          id: blocksTable.id,
          content: blocksTable.content,
          answer: blocksTable.answer,
          type: blocksTable.type,
        })
        .from(blocksTable)
        .where(eq(blocksTable.workBookId, session.workBookId));

      const submits = await tx
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

      const saveSubmits = blocks.map((block) => {
        const submittedAnswer = submitByBlockId[block.id];
        const isCorrect = block.answer
          ? checkAnswer(block.answer as unknown as BlockAnswer, submittedAnswer)
          : false;
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

      const correctBlocksCount = saveSubmits.filter(
        (submit) => submit.isCorrect,
      ).length;
      const totalBlocks = blocks.length;
      const score =
        totalBlocks > 0
          ? Math.round((correctBlocksCount * 100) / totalBlocks)
          : 0;

      const now = new Date();

      await tx
        .update(workBookSubmitsTable)
        .set({
          endTime: now,
          blockCount: totalBlocks,
          correctBlocks: correctBlocksCount,
        })
        .where(eq(workBookSubmitsTable.id, submitId));

      const inserted = await tx
        .insert(workBookUserFirstScoresTable)
        .values({
          workBookId: session.workBookId,
          ownerId: userId,
          score,
          submitId: submitId,
          firstSubmittedAt: now,
          createdAt: now,
        })
        .onConflictDoNothing({
          target: [
            workBookUserFirstScoresTable.workBookId,
            workBookUserFirstScoresTable.ownerId,
          ],
        })
        .returning({
          workBookId: workBookUserFirstScoresTable.workBookId,
        });

      if (inserted.length > 0) {
        await tx
          .update(workBooksTable)
          .set({
            firstScoreSum: sql`${workBooksTable.firstScoreSum} + ${score}`,
            firstSolverCount: sql`${workBooksTable.firstSolverCount} + 1`,
          })
          .where(eq(workBooksTable.id, session.workBookId));
      }
    });
  },

  /**
   * 풀고있는 문제집
   * @param userId 사용자 ID
   * @returns 풀고있는 문제집 목록
   */
  searchWorkBookSessions: async (
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      active?: boolean;
    },
  ): Promise<WorkBookSession[]> => {
    const { page = 1, limit = 100, active = true } = options ?? {};
    const offset = (page - 1) * limit;

    const where = [eq(workBookSubmitsTable.ownerId, userId)];

    where.push(eq(workBookSubmitsTable.active, Boolean(active)));

    const rows = await pgDb
      .select({
        ...WorkBookColumnsForList,
        startTime: workBookSubmitsTable.startTime,
        endTime: workBookSubmitsTable.endTime,
        blockCount: workBookSubmitsTable.blockCount,
        submitId: workBookSubmitsTable.id,
        correctBlocks: workBookSubmitsTable.correctBlocks,
      })
      .from(workBookSubmitsTable)
      .innerJoin(
        workBooksTable,
        and(
          eq(workBookSubmitsTable.workBookId, workBooksTable.id),
          isNull(workBooksTable.deletedAt),
        ),
      )
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .where(and(...where))
      .orderBy(desc(workBookSubmitsTable.startTime))
      .offset(offset)
      .limit(limit);

    return rows.map((row) => {
      const {
        startTime,
        endTime,
        blockCount,
        submitId,
        correctBlocks,
        ...workBook
      } = row;

      return {
        workBook: workBook as WorkBookWithoutAnswer,
        session: {
          status: endTime ? "submitted" : "in-progress",
          startTime: startTime,
          submitId: submitId,
          endTime: endTime,
          totalBlocks: blockCount,
          correctBlocks: correctBlocks,
        } as SessionInProgress | SessionSubmitted,
      };
    });
  },

  /**
   * 문제집 최신 결과 및 제출 답안 조회
   * @param workBookId 문제집 ID
   * @param userId 사용자 ID
   */
  async getReviewSession(
    submitId: string,
    userId: string,
  ): Promise<WorkBookReviewSession | null> {
    const [row] = await pgDb
      .select({
        id: workBookSubmitsTable.id,
        workBookId: workBookSubmitsTable.workBookId,
        startTime: workBookSubmitsTable.startTime,
        endTime: workBookSubmitsTable.endTime,
        totalBlocks: workBookSubmitsTable.blockCount,
        correctBlocks: workBookSubmitsTable.correctBlocks,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.id, submitId),
          eq(workBookSubmitsTable.ownerId, userId),
          isNotNull(workBookSubmitsTable.endTime),
        ),
      );

    if (!row) {
      return null;
    }

    const workBook = await workBookService.getWorkBookWithBlocks(
      row.workBookId,
    );
    if (!workBook) {
      return null;
    }

    const isLiked = await workBookService.isLikedWorkBook(
      row.workBookId,
      userId,
    );

    const session: SessionSubmitted = {
      status: "submitted",
      startTime: row.startTime,
      submitId: row.id,
      endTime: row.endTime!,
      totalBlocks: row.totalBlocks,
      correctBlocks: row.correctBlocks,
    };
    const submitAnswers = await workBookService.getSubmitAnswers(row.id);
    return {
      workBook: { ...workBook },
      isLiked,
      session,
      submitAnswers,
    };
  },

  getSubmitAnswers: async (
    submitId: string,
  ): Promise<
    {
      submit: BlockAnswerSubmit;
      isCorrect: boolean;
      blockId: string;
    }[]
  > => {
    const rows = await pgDb
      .select({
        blockId: workBookBlockAnswerSubmitsTable.blockId,
        isCorrect: workBookBlockAnswerSubmitsTable.isCorrect,
        submit: workBookBlockAnswerSubmitsTable.answer,
      })
      .from(workBookBlockAnswerSubmitsTable)
      .where(eq(workBookBlockAnswerSubmitsTable.submitId, submitId));
    return rows;
  },

  getSessionStatusByWorkBookId: async (
    workBookId: string,
    userId: string,
  ): Promise<SessionStatus> => {
    const [session] = await pgDb
      .select({
        startTime: workBookSubmitsTable.startTime,
        submitId: workBookSubmitsTable.id,
        endTime: workBookSubmitsTable.endTime,
        blockCount: workBookSubmitsTable.blockCount,
        correctBlocks: workBookSubmitsTable.correctBlocks,
      })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
          eq(workBookSubmitsTable.active, true),
        ),
      )
      .orderBy(desc(workBookSubmitsTable.startTime))
      .limit(1);
    if (!session) return { status: "not-started" };
    if (!session.endTime)
      return {
        status: "in-progress",
        startTime: session.startTime,
        submitId: session.submitId,
      };

    return {
      status: "submitted",
      startTime: session.startTime,
      submitId: session.submitId,
      endTime: session.endTime,
      totalBlocks: session.blockCount,
      correctBlocks: session.correctBlocks,
    };
  },

  unActiveSessionByWorkBookId: async (
    userId: string,
    workBookId: string,
  ): Promise<void> => {
    await pgDb
      .update(workBookSubmitsTable)
      .set({
        active: false,
      })
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
          eq(workBookSubmitsTable.active, true),
        ),
      );
  },
  toggleLikeWorkBook: async (
    workBookId: string,
    userId: string,
  ): Promise<{ count: number; isLiked: boolean }> => {
    return pgDb.transaction(async (tx) => {
      const [likeRow] = await tx
        .select({
          workBookId: WorkBookLikes.workBookId,
        })
        .from(WorkBookLikes)
        .where(
          and(
            eq(WorkBookLikes.workBookId, workBookId),
            eq(WorkBookLikes.userId, userId),
          ),
        );
      if (likeRow) {
        await tx
          .delete(WorkBookLikes)
          .where(
            and(
              eq(WorkBookLikes.workBookId, workBookId),
              eq(WorkBookLikes.userId, userId),
            ),
          );
        const [updated] = await tx
          .update(workBooksTable)
          .set({
            likeCount: sql`${workBooksTable.likeCount} - 1`,
          })
          .where(eq(workBooksTable.id, workBookId))
          .returning({
            likeCount: workBooksTable.likeCount,
          });
        return {
          count: updated?.likeCount,
          isLiked: false,
        };
      } else {
        await tx.insert(WorkBookLikes).values({
          workBookId,
          userId,
        });
        const [updated] = await tx
          .update(workBooksTable)
          .set({
            likeCount: sql`${workBooksTable.likeCount} + 1`,
          })
          .where(eq(workBooksTable.id, workBookId))
          .returning({
            likeCount: workBooksTable.likeCount,
          });
        return {
          count: updated?.likeCount,
          isLiked: true,
        };
      }
    });
  },
  isLikedWorkBook: async (
    workBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [row] = await pgDb
      .select({
        workBookId: WorkBookLikes.workBookId,
      })
      .from(WorkBookLikes)
      .where(
        and(
          eq(WorkBookLikes.workBookId, workBookId),
          eq(WorkBookLikes.userId, userId),
        ),
      );
    return Boolean(row);
  },

  /**
   * 문제집 리포트 통계 조회 (첫 제출 기준)
   * @param workBookId 문제집 ID
   * @returns 문제별 정답률 통계
   */
  getWorkBookReportStats: async (
    workBookId: string,
  ): Promise<{
    blockStats: {
      blockId: string;
      question: string;
      order: number;
      type: string;
      totalSubmits: number;
      correctCount: number;
      correctRate: number;
      content: any;
      answer: any;
    }[];
    scoreDistribution: { range: string; count: number }[];
    dailySolves: { date: string; count: number }[];
  }> => {
    // 첫 제출 기준 submitId들 가져오기
    const firstSubmitIds = pgDb
      .select({ submitId: workBookUserFirstScoresTable.submitId })
      .from(workBookUserFirstScoresTable)
      .where(eq(workBookUserFirstScoresTable.workBookId, workBookId));

    // 점수 분포 및 일자별 집계를 위한 데이터
    const scores = await pgDb
      .select({
        score: workBookUserFirstScoresTable.score,
        firstSubmittedAt: workBookUserFirstScoresTable.firstSubmittedAt,
      })
      .from(workBookUserFirstScoresTable)
      .where(eq(workBookUserFirstScoresTable.workBookId, workBookId));

    const distributionMap = new Map<string, number>();
    const ranges = ["0-20", "21-40", "41-60", "61-80", "81-100"];
    ranges.forEach((r) => distributionMap.set(r, 0));

    scores.forEach(({ score }) => {
      let range = "0-20";
      if (score > 80) range = "81-100";
      else if (score > 60) range = "61-80";
      else if (score > 40) range = "41-60";
      else if (score > 20) range = "21-40";
      distributionMap.set(range, (distributionMap.get(range) || 0) + 1);
    });

    const scoreDistribution = Array.from(distributionMap.entries()).map(
      ([range, count]) => ({ range, count }),
    );

    // 일자별 풀이 수 집계 (최근 30일)
    const dailySolveMap = new Map<string, number>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]!;
      dailySolveMap.set(dateStr, 0);
    }

    scores.forEach(({ firstSubmittedAt }) => {
      const dateStr = firstSubmittedAt.toISOString().split("T")[0]!;
      if (dailySolveMap.has(dateStr)) {
        dailySolveMap.set(dateStr, (dailySolveMap.get(dateStr) || 0) + 1);
      }
    });

    const dailySolves = Array.from(dailySolveMap.entries()).map(
      ([date, count]) => ({ date, count }),
    );

    // 문제별 정답률 집계
    const blockStats = await pgDb
      .select({
        blockId: blocksTable.id,
        question: blocksTable.question,
        order: blocksTable.order,
        type: blocksTable.type,
        content: blocksTable.content,
        answer: blocksTable.answer,
        totalSubmits: sql<number>`count(${workBookBlockAnswerSubmitsTable.submitId})::int`,
        correctCount: sql<number>`sum(case when ${workBookBlockAnswerSubmitsTable.isCorrect} then 1 else 0 end)::int`,
      })
      .from(blocksTable)
      .leftJoin(
        workBookBlockAnswerSubmitsTable,
        and(
          eq(blocksTable.id, workBookBlockAnswerSubmitsTable.blockId),
          inArray(workBookBlockAnswerSubmitsTable.submitId, firstSubmitIds),
        ),
      )
      .where(eq(blocksTable.workBookId, workBookId))
      .groupBy(blocksTable.id)
      .orderBy(blocksTable.order);

    return {
      blockStats: blockStats.map((stat) => ({
        ...stat,
        totalSubmits: stat.totalSubmits || 0,
        correctCount: stat.correctCount || 0,
        correctRate:
          stat.totalSubmits > 0
            ? Math.round((stat.correctCount / stat.totalSubmits) * 100)
            : 0,
      })),
      scoreDistribution,
      dailySolves,
    };
  },

  /**
   * 추천 문제집 조회
   * 우선순위: 1. 풀지 않은 문제집 2. 같은 카테고리 3. 최근 배포
   * @param options excludeWorkBookId, userId, categoryId
   * @returns 추천 문제집 목록 (최대 3개)
   */
  getRecommendedWorkBooks: async (options: {
    excludeWorkBookId: string;
    userId: string;
    categoryId?: number | null;
  }): Promise<WorkBookWithoutBlocks[]> => {
    const { excludeWorkBookId, userId, categoryId } = options;

    const rows = await pgDb
      .select({
        ...WorkBookColumnsForList,
        isSolved: sql<boolean>`CASE WHEN ${workBookUserFirstScoresTable.workBookId} IS NOT NULL THEN true ELSE false END`,
        isSameCategory: sql<boolean>`CASE WHEN ${workBooksTable.categoryId} = ${categoryId ?? null} THEN true ELSE false END`,
      })
      .from(workBooksTable)
      .innerJoin(userTable, eq(workBooksTable.ownerId, userTable.id))
      .leftJoin(
        workBookUserFirstScoresTable,
        and(
          eq(workBooksTable.id, workBookUserFirstScoresTable.workBookId),
          eq(workBookUserFirstScoresTable.ownerId, userId),
        ),
      )
      .where(
        and(
          eq(workBooksTable.isPublic, true),
          isNotNull(workBooksTable.publishedAt),
          isNull(workBooksTable.deletedAt),
          sql`${workBooksTable.id} != ${excludeWorkBookId}`,
        ),
      )
      .orderBy(
        // 1. 풀지 않은 문제집 우선
        sql`CASE WHEN ${workBookUserFirstScoresTable.workBookId} IS NULL THEN 0 ELSE 1 END`,
        // 2. 같은 카테고리 우선
        sql`CASE WHEN ${workBooksTable.categoryId} = ${categoryId ?? null} THEN 0 ELSE 1 END`,
        // 3. 최근 배포순
        desc(workBooksTable.publishedAt),
      )
      .limit(3);

    // isSolved, isSameCategory 필드 제거하고 반환
    return rows.map(({ isSolved, isSameCategory, ...workBook }) => workBook);
  },
};
