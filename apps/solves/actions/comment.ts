"use server";

import { commentService } from "@service/solves";
import { PublicError } from "@workspace/error";
import z from "zod";

import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

/** 권한 체크 헬퍼 */
const checkPermission = async (workBookId: string, userId: string) => {
  const hasSubmitted = await commentService.hasSubmitted(workBookId, userId);
  if (!hasSubmitted) {
    throw new PublicError("문제집을 풀어야 댓글을 작성할 수 있습니다.");
  }
};

/** 댓글 목록 조회 */
export const getCommentsAction = safeAction(
  z.object({ workBookId: z.string() }),
  async ({ workBookId }) => {
    const session = await getSession().catch(() => null);
    return commentService.getComments(workBookId, session?.user?.id);
  },
);

/** 루트 댓글 작성 */
export const createCommentAction = safeAction(
  z.object({ workBookId: z.string(), body: z.string().min(1) }),
  async ({ workBookId, body }) => {
    const session = await getSession();
    await checkPermission(workBookId, session.user.id);
    return commentService.createComment(workBookId, session.user.id, body);
  },
);

/** 대댓글 작성 */
export const createReplyAction = safeAction(
  z.object({ commentId: z.string(), body: z.string().min(1) }),
  async ({ commentId, body }) => {
    const session = await getSession();
    const workBookId = await commentService.getCommentWorkBookId(commentId);
    if (!workBookId) throw new PublicError("댓글을 찾을 수 없습니다");
    await checkPermission(workBookId, session.user.id);
    return commentService.createReply(commentId, session.user.id, body);
  },
);

/** 댓글 수정 */
export const updateCommentAction = safeAction(
  z.object({ commentId: z.string(), body: z.string().min(1) }),
  async ({ commentId, body }) => {
    const session = await getSession();
    return commentService.updateComment(commentId, session.user.id, body);
  },
);

/** 댓글 삭제 */
export const deleteCommentAction = safeAction(
  z.object({ commentId: z.string() }),
  async ({ commentId }) => {
    const session = await getSession();
    return commentService.deleteComment(commentId, session.user.id);
  },
);

/** 좋아요 토글 */
export const toggleCommentLikeAction = safeAction(
  z.object({ commentId: z.string() }),
  async ({ commentId }) => {
    const session = await getSession();
    const workBookId = await commentService.getCommentWorkBookId(commentId);
    if (!workBookId) throw new PublicError("댓글을 찾을 수 없습니다");
    await checkPermission(workBookId, session.user.id);
    return commentService.toggleLike(commentId, session.user.id);
  },
);
