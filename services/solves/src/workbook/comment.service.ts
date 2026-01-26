import { userTable } from "@service/auth";
import { PublicError } from "@workspace/error";
import { and, asc, eq, gt, inArray, isNull, sql } from "drizzle-orm";

import { pgDb } from "../db";
import {
  workBookCommentLikesTable,
  workBookCommentsTable,
  workBookSubmitsTable,
} from "./schema";
import {
  PaginatedCommentsResponse,
  WorkbookComment,
  WorkbookCommentWithReplies,
} from "./types";

/** Subquery for counting likes on a comment */
const LikeCountSubQuery = pgDb
  .select({ count: sql<number>`count(*)::int` })
  .from(workBookCommentLikesTable)
  .where(eq(workBookCommentLikesTable.commentId, workBookCommentsTable.id));

/** Subquery factory for checking if a user has liked a comment */
const createIsLikedByMeSubQuery = (userId: string) =>
  pgDb
    .select({ exists: sql<boolean>`true` })
    .from(workBookCommentLikesTable)
    .where(
      and(
        eq(workBookCommentLikesTable.commentId, workBookCommentsTable.id),
        eq(workBookCommentLikesTable.userId, userId),
      ),
    );

export const WorkbookCommentColumns = {
  id: workBookCommentsTable.id,
  parentId: workBookCommentsTable.parentId,
  authorNickname: userTable.nickname,
  authorPublicId: userTable.publicId,
  authorProfile: userTable.image,
  body: workBookCommentsTable.body,
  createdAt: workBookCommentsTable.createdAt,
  updatedAt: workBookCommentsTable.updatedAt,
};

export const commentService = {
  getCommentCountByWorkBookId: async (workBookId: string): Promise<number> => {
    const [row] = await pgDb
      .select({ count: sql<number>`count(*)::int` })
      .from(workBookCommentsTable)
      .where(eq(workBookCommentsTable.workBookId, workBookId));
    return row?.count ?? 0;
  },
  // 제출 완료한 사용자만 댓글 작성 가능
  hasWritePermission: async (
    workBookId: string,
    userId: string,
  ): Promise<boolean> => {
    const [row] = await pgDb
      .select({ id: workBookSubmitsTable.id })
      .from(workBookSubmitsTable)
      .where(
        and(
          eq(workBookSubmitsTable.workBookId, workBookId),
          eq(workBookSubmitsTable.ownerId, userId),
        ),
      )
      .limit(1);
    return !!row;
  },

  /** 댓글 목록 조회 (페이지네이션 + 대댓글 포함) */
  getComments: async (
    workBookId: string,
    options: { cursor?: string; limit?: number; userId?: string } = {},
  ): Promise<PaginatedCommentsResponse> => {
    const { cursor, limit = 50, userId } = options;
    // 1. Fetch root comments with pagination (parentId IS NULL)
    const rootCommentsQuery = pgDb
      .select({
        id: workBookCommentsTable.id,
        parentId: workBookCommentsTable.parentId,
        authorNickname: userTable.nickname,
        authorPublicId: userTable.publicId,
        authorProfile: userTable.image,
        body: workBookCommentsTable.body,
        createdAt: workBookCommentsTable.createdAt,
        updatedAt: workBookCommentsTable.updatedAt,
        likeCount: sql<number>`coalesce((${LikeCountSubQuery}), 0)`,
        isLikedByMe: userId
          ? sql<boolean>`coalesce((${createIsLikedByMeSubQuery(userId)}), false)`
          : sql<boolean>`false`,
      })
      .from(workBookCommentsTable)
      .leftJoin(userTable, eq(workBookCommentsTable.authorId, userTable.id))
      .where(
        and(
          eq(workBookCommentsTable.workBookId, workBookId),
          isNull(workBookCommentsTable.parentId),
          cursor ? gt(workBookCommentsTable.id, cursor) : undefined,
        ),
      )
      .orderBy(asc(workBookCommentsTable.createdAt))
      .limit(limit + 1); // +1 to check hasMore

    console.log(rootCommentsQuery.toSQL());

    const rootComments = await rootCommentsQuery;

    const hasMore = rootComments.length > limit;
    if (hasMore) rootComments.pop();

    if (rootComments.length === 0) {
      return { comments: [], nextCursor: null };
    }

    // 2. Fetch all replies for these root comments in single query
    const rootIds = rootComments.map((c) => c.id);
    const replies = await pgDb
      .select({
        id: workBookCommentsTable.id,
        parentId: workBookCommentsTable.parentId,
        authorNickname: userTable.nickname,
        authorPublicId: userTable.publicId,
        authorProfile: userTable.image,
        body: workBookCommentsTable.body,
        createdAt: workBookCommentsTable.createdAt,
        updatedAt: workBookCommentsTable.updatedAt,
        likeCount: sql<number>`coalesce((${LikeCountSubQuery}), 0)`,
        isLikedByMe: userId
          ? sql<boolean>`coalesce((${createIsLikedByMeSubQuery(userId)}), false)`
          : sql<boolean>`false`,
      })
      .from(workBookCommentsTable)
      .leftJoin(userTable, eq(workBookCommentsTable.authorId, userTable.id))
      .where(inArray(workBookCommentsTable.parentId, rootIds))
      .orderBy(asc(workBookCommentsTable.createdAt));

    // 3. Group replies by parentId
    const repliesMap: Record<string, WorkbookComment[]> = {};
    for (const reply of replies) {
      const parentId = reply.parentId!;
      if (!repliesMap[parentId]) {
        repliesMap[parentId] = [];
      }
      repliesMap[parentId].push(reply);
    }

    // 4. Combine root comments with their replies
    const commentsWithReplies: WorkbookCommentWithReplies[] = rootComments.map(
      (comment) => ({
        ...comment,
        replies: repliesMap[comment.id] || [],
      }),
    );

    return {
      comments: commentsWithReplies,
      nextCursor: hasMore ? rootComments[rootComments.length - 1].id : null,
    };
  },

  /** 루트 댓글 작성 */
  createComment: async ({
    workBookId,
    authorId,
    body,
    parentId,
  }: {
    workBookId: string;
    authorId: string;
    body: string;
    parentId?: string;
  }): Promise<WorkbookComment> => {
    const [inserted] = await pgDb
      .insert(workBookCommentsTable)
      .values({ workBookId, authorId, body, parentId })
      .returning({ id: workBookCommentsTable.id });

    // Query back with full author info
    const [comment] = await pgDb
      .select({
        id: workBookCommentsTable.id,
        parentId: workBookCommentsTable.parentId,
        authorNickname: userTable.nickname,
        authorPublicId: userTable.publicId,
        authorProfile: userTable.image,
        body: workBookCommentsTable.body,
        createdAt: workBookCommentsTable.createdAt,
        updatedAt: workBookCommentsTable.updatedAt,
        likeCount: sql<number>`0`,
        isLikedByMe: sql<boolean>`false`,
      })
      .from(workBookCommentsTable)
      .leftJoin(userTable, eq(workBookCommentsTable.authorId, userTable.id))
      .where(eq(workBookCommentsTable.id, inserted.id));

    return comment;
  },

  /** 댓글 수정 */
  updateComment: async (
    commentId: string,
    authorId: string,
    body: string,
  ): Promise<void> => {
    const result = await pgDb
      .update(workBookCommentsTable)
      .set({ body, updatedAt: new Date() })
      .where(
        and(
          eq(workBookCommentsTable.id, commentId),
          eq(workBookCommentsTable.authorId, authorId),
          isNull(workBookCommentsTable.deletedAt),
        ),
      );
    if (result.rowCount === 0) throw new PublicError("댓글을 찾을 수 없어요.");
  },

  /** 댓글 삭제 (soft delete) */
  deleteComment: async (commentId: string, authorId: string): Promise<void> => {
    const result = await pgDb
      .update(workBookCommentsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(workBookCommentsTable.id, commentId),
          eq(workBookCommentsTable.authorId, authorId),
        ),
      );
    if (result.rowCount === 0) throw new PublicError("댓글을 찾을 수 없어요.");
  },

  /** 좋아요 토글 */
  toggleLike: async (
    commentId: string,
    userId: string,
  ): Promise<{ isLiked: boolean }> => {
    const [likeRow] = await pgDb
      .select({ commentId: workBookCommentLikesTable.commentId })
      .from(workBookCommentLikesTable)
      .where(
        and(
          eq(workBookCommentLikesTable.commentId, commentId),
          eq(workBookCommentLikesTable.userId, userId),
        ),
      );

    if (likeRow) {
      await pgDb
        .delete(workBookCommentLikesTable)
        .where(
          and(
            eq(workBookCommentLikesTable.commentId, commentId),
            eq(workBookCommentLikesTable.userId, userId),
          ),
        );
      return { isLiked: false };
    } else {
      await pgDb
        .insert(workBookCommentLikesTable)
        .values({ commentId, userId });
      return { isLiked: true };
    }
  },
};
