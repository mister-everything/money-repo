import { userTable } from "@service/auth";
import { PublicError } from "@workspace/error";
import { and, desc, eq, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { CommunityCommentTable } from "./schema";
import { CommunityComment } from "./types";

const CommunityCommentColumns = {
  id: CommunityCommentTable.id,
  content: CommunityCommentTable.content,
  createdAt: CommunityCommentTable.createdAt,
  ownerPublicId: userTable.publicId,
  ownerName: userTable.nickname,
  ownerProfile: userTable.image,
  ownerRole: userTable.role,
};

export const communityService = {
  async createComment({
    userId,
    content,
  }: {
    userId: string;
    content: string;
  }): Promise<CommunityComment> {
    return await pgDb.transaction(async (tx) => {
      // 24시간 이내 작성한 댓글이 있는지 체크
      const [existingComment] = await tx
        .select({ id: CommunityCommentTable.id })
        .from(CommunityCommentTable)
        .where(
          and(
            eq(CommunityCommentTable.userId, userId),
            sql`${CommunityCommentTable.createdAt} > NOW() - INTERVAL '24 hours'`,
          ),
        )
        .limit(1);

      if (existingComment) {
        throw new PublicError("24시간 이내에는 다시 작성할 수 없어요.");
      }

      // 댓글 생성 (UTC 기준으로 명시적으로 저장)
      const [newComment] = await tx
        .insert(CommunityCommentTable)
        .values({
          userId,
          content,
        })
        .returning({
          id: CommunityCommentTable.id,
        });

      const [row] = await tx
        .select(CommunityCommentColumns)
        .from(CommunityCommentTable)
        .innerJoin(userTable, eq(CommunityCommentTable.userId, userTable.id))
        .where(eq(CommunityCommentTable.id, newComment.id));

      return row;
    });
  },

  async listComments({
    limit = 50,
  }: {
    limit?: number;
  }): Promise<CommunityComment[]> {
    const comments = await pgDb
      .select(CommunityCommentColumns)
      .from(CommunityCommentTable)
      .innerJoin(userTable, eq(CommunityCommentTable.userId, userTable.id))
      .orderBy(desc(CommunityCommentTable.createdAt))
      .limit(limit);

    return comments;
  },

  async deleteComment({
    commentId,
    requesterUserId,
    isAdmin,
  }: {
    commentId: string;
    requesterUserId: string;
    isAdmin: boolean;
  }): Promise<void> {
    // 댓글 조회
    const [comment] = await pgDb
      .select({
        userId: CommunityCommentTable.userId,
      })
      .from(CommunityCommentTable)
      .where(eq(CommunityCommentTable.id, commentId))
      .limit(1);

    if (!comment) {
      throw new PublicError("댓글을 찾을 수 없어요.");
    }

    // 권한 체크: 본인이거나 관리자여야 함
    if (comment.userId !== requesterUserId && !isAdmin) {
      throw new PublicError("삭제 권한이 없어요.");
    }

    // 삭제
    await pgDb
      .delete(CommunityCommentTable)
      .where(eq(CommunityCommentTable.id, commentId));
  },
};
