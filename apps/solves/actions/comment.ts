"use server";

import { validateComment } from "@service/auth/shared";
import { commentService } from "@service/solves";
import { PublicError } from "@workspace/error";
import z from "zod";
import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

/** 권한 체크 헬퍼 */
const checkPermission = async (workBookId: string, userId: string) => {
  const hasSubmitted = await commentService.hasWritePermission(
    workBookId,
    userId,
  );
  if (!hasSubmitted) {
    throw new PublicError("문제집을 풀어야 댓글을 작성할 수 있습니다.");
  }
};

/** 루트 댓글 작성 */
export const createCommentAction = safeAction(
  z.object({
    workBookId: z.string(),
    body: z
      .string("최소 1자 이상, 최대 280자 이하의 문자열을 입력해주세요.")
      .min(1)
      .max(280),
    parentId: z.string().optional(),
  }),
  async ({ workBookId, body, parentId }) => {
    const validation = validateComment(body);
    if (!validation.valid) {
      throw new PublicError(validation.error ?? "댓글 작성에 실패했습니다.");
    }
    const session = await getSession();
    await checkPermission(workBookId, session.user.id);
    return commentService.createComment({
      workBookId,
      authorId: session.user.id,
      body,
      parentId,
    });
  },
);

/** 댓글 수정 */
export const updateCommentAction = safeAction(
  z.object({
    commentId: z.string(),
    body: z
      .string("최소 1자 이상, 최대 280자 이하의 문자열을 입력해주세요.")
      .min(1)
      .max(280),
  }),
  async ({ commentId, body }) => {
    const session = await getSession();
    await commentService.updateComment(commentId, session.user.id, body);
  },
);

/** 댓글 삭제 */
export const deleteCommentAction = safeAction(
  z.object({ commentId: z.string() }),
  async ({ commentId }) => {
    const session = await getSession();
    commentService.deleteComment(commentId, session.user.id);
  },
);

/** 좋아요 토글 */
export const toggleCommentLikeAction = safeAction(
  z.object({ commentId: z.string() }),
  async ({ commentId }) => {
    const session = await getSession();
    return commentService.toggleLike(commentId, session.user.id);
  },
);
