"use server";

import { userService } from "@service/auth";
import { communityService } from "@service/solves";
import { createCommunityCommentSchema } from "@service/solves/shared";
import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

export const createCommunityCommentAction = safeAction(
  createCommunityCommentSchema,
  async (input) => {
    const session = await getSession();

    const comment = await communityService.createComment({
      userId: session.user.id,
      content: input.content,
    });

    return comment;
  },
);

export const deleteCommunityCommentAction = safeAction(
  async (input: { commentId: string }) => {
    const session = await getSession();
    const isAdmin = await userService.isAdmin(session.user.id);

    await communityService.deleteComment({
      commentId: input.commentId,
      requesterUserId: session.user.id,
      isAdmin,
    });

    return { success: true };
  },
);
