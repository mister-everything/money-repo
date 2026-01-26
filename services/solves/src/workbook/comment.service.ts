import { userTable } from "@service/auth";
import { PublicError } from "@workspace/error";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { pgDb } from "../db";
import {
  workBookCommentLikesTable,
  workBookCommentsTable,
  workBookSubmitsTable,
} from "./schema";

export const commentService = {
  /** 제출 완료 여부 확인 (권한 체크) */
  hasSubmitted: async (
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

  /** 댓글 목록 조회 */
  getComments: async (workBookId: string, userId?: string) => {
    const comments = await pgDb
      .select({
        id: workBookCommentsTable.id,
        parentId: workBookCommentsTable.parentId,
        authorId: workBookCommentsTable.authorId,
        body: workBookCommentsTable.body,
        createdAt: workBookCommentsTable.createdAt,
        editedAt: workBookCommentsTable.editedAt,
        deletedAt: workBookCommentsTable.deletedAt,
        authorNickname: userTable.nickname,
        authorImage: userTable.image,
      })
      .from(workBookCommentsTable)
      .leftJoin(userTable, eq(workBookCommentsTable.authorId, userTable.id))
      .where(eq(workBookCommentsTable.workBookId, workBookId));

    const commentIds = comments.map((c) => c.id);
    if (commentIds.length === 0) return [];

    const likeCounts = await pgDb
      .select({
        commentId: workBookCommentLikesTable.commentId,
      })
      .from(workBookCommentLikesTable)
      .where(inArray(workBookCommentLikesTable.commentId, commentIds));

    // 좋아요 수 집계
    const likeCountMap: Record<string, number> = {};
    for (const like of likeCounts) {
      likeCountMap[like.commentId] = (likeCountMap[like.commentId] || 0) + 1;
    }

    let myLikes: string[] = [];
    if (userId) {
      const rows = await pgDb
        .select({ commentId: workBookCommentLikesTable.commentId })
        .from(workBookCommentLikesTable)
        .where(
          and(
            inArray(workBookCommentLikesTable.commentId, commentIds),
            eq(workBookCommentLikesTable.userId, userId),
          ),
        );
      myLikes = rows.map((r) => r.commentId);
    }

    return comments.map((c) => ({
      ...c,
      likeCount: likeCountMap[c.id] ?? 0,
      isLikedByMe: myLikes.includes(c.id),
    }));
  },

  /** 루트 댓글 작성 */
  createComment: async (workBookId: string, authorId: string, body: string) => {
    const [comment] = await pgDb
      .insert(workBookCommentsTable)
      .values({ workBookId, authorId, body })
      .returning();
    return comment;
  },

  /** 대댓글 작성 */
  createReply: async (parentId: string, authorId: string, body: string) => {
    const [parent] = await pgDb
      .select({
        workBookId: workBookCommentsTable.workBookId,
        parentId: workBookCommentsTable.parentId,
      })
      .from(workBookCommentsTable)
      .where(eq(workBookCommentsTable.id, parentId));

    if (!parent) throw new PublicError("부모 댓글을 찾을 수 없습니다.");
    if (parent.parentId) throw new PublicError("대대댓글은 지원하지 않습니다.");

    const [reply] = await pgDb
      .insert(workBookCommentsTable)
      .values({
        workBookId: parent.workBookId,
        parentId,
        authorId,
        body,
      })
      .returning();
    return reply;
  },

  /** 댓글 수정 */
  updateComment: async (commentId: string, authorId: string, body: string) => {
    const [updated] = await pgDb
      .update(workBookCommentsTable)
      .set({ body, editedAt: new Date() })
      .where(
        and(
          eq(workBookCommentsTable.id, commentId),
          eq(workBookCommentsTable.authorId, authorId),
          isNull(workBookCommentsTable.deletedAt),
        ),
      )
      .returning();
    return updated;
  },

  /** 댓글 삭제 (soft delete) */
  deleteComment: async (commentId: string, authorId: string) => {
    const [deleted] = await pgDb
      .update(workBookCommentsTable)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(workBookCommentsTable.id, commentId),
          eq(workBookCommentsTable.authorId, authorId),
        ),
      )
      .returning();
    return deleted;
  },

  /** 좋아요 토글 */
  toggleLike: async (commentId: string, userId: string) => {
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

  /** 댓글의 workBookId 조회 (권한 체크용) */
  getCommentWorkBookId: async (commentId: string): Promise<string | null> => {
    const [row] = await pgDb
      .select({ workBookId: workBookCommentsTable.workBookId })
      .from(workBookCommentsTable)
      .where(eq(workBookCommentsTable.id, commentId));
    return row?.workBookId ?? null;
  },
};
