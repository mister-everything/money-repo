"use server";

import { workBookService } from "@service/solves";
import { UpdateBlock, WorkBookBlock } from "@service/solves/shared";
import z from "zod";
import { getSession } from "@/lib/auth/server";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

export const createWorkbookAction = safeAction(
  z.object({
    title: z.string().optional().default(""),
    categoryId: z.number().min(1, "카테고리를 선택해주세요."),
  }),
  async ({ title, categoryId }) => {
    const session = await getSession();

    const savedWorkBook = await workBookService.createWorkBook({
      title,
      ownerId: session.user.id,
      categoryId,
    });

    return savedWorkBook;
  },
);

export const updateWorkbookAction = safeAction(
  z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  async ({ id, title, description }) => {
    const session = await getSession();
    await workBookService.checkEditPermission(id, session.user.id);

    await workBookService.updateWorkBook({ id, title, description });
  },
);

export const processUpdateBlocksAction = safeAction(
  async ({
    workbookId,
    deleteBlocks,
    insertBlocks,
    updateBlocks,
  }: {
    workbookId: string;
    deleteBlocks: string[];
    insertBlocks: WorkBookBlock[];
    updateBlocks: UpdateBlock[];
  }) => {
    const session = await getSession();
    await workBookService.checkEditPermission(workbookId, session.user.id);
    await workBookService.processUpdateBlocks(workbookId, {
      deleteBlocks,
      insertBlocks,
      updateBlocks,
    });
  },
);

export const publishWorkbookAction = safeAction(
  z.object({
    workBookId: z.string(),
    tags: z
      .array(
        z
          .string()
          .min(1, "최소 1글자 이상의 태그를 입력해주세요.")
          .max(10, "최대 10글자 이하의 태그를 입력해주세요."),
      )
      .optional(),
  }),
  async ({ workBookId, tags }) => {
    const session = await getSession();

    await workBookService.publishWorkbook({
      workBookId,
      userId: session.user.id,
      tags,
    });
  },
);

export const saveAnswerProgressAction = safeAction(
  z.object({
    submitId: z.string(),
    answers: z.record(z.string(), z.any()).optional().default({}),
    deleteAnswers: z.array(z.string()).optional().default([]),
  }),
  async ({ submitId, answers, deleteAnswers }) => {
    const session = await getSession();
    await workBookService.saveAnswerProgress(session.user.id, submitId, {
      answers,
      deleteAnswers,
    });
  },
);

export const resetWorkBookSessionAction = safeAction(
  z.object({
    submitId: z.string(),
  }),
  async ({ submitId }) => {
    const session = await getSession();
    await workBookService.resetWorkBookSession({
      userId: session.user.id,
      submitId,
    });
  },
);
export const submitWorkbookSessionAction = safeAction(
  z.object({
    submitId: z.string(),
  }),
  async ({ submitId }) => {
    const session = await getSession();
    await workBookService.submitWorkBookSession(session.user.id, submitId);
  },
);

export const deleteWorkbookAction = safeAction(
  z.object({
    workBookId: z.string(),
  }),
  async ({ workBookId }) => {
    const session = await getSession();
    await workBookService.checkEditPermission(workBookId, session.user.id);
    await workBookService.deleteWorkBook(workBookId);
    return { deletedWorkBookId: workBookId };
  },
);

export const softDeleteWorkbookAction = safeAction(
  z.object({
    workBookId: z.string(),
    reason: z.string().optional(),
  }),
  async ({ workBookId, reason }) => {
    const session = await getSession();
    const isOwner = await workBookService.isWorkBookOwner(
      workBookId,
      session.user.id,
    );
    if (!isOwner) {
      return fail("권한이 없습니다.");
    }
    await workBookService.softDeleteWorkBook(workBookId, reason);
    return { softDeletedWorkBookId: workBookId };
  },
);

export const toggleWorkBookPublicAction = safeAction(
  z.object({
    workBookId: z.string(),
    isPublic: z.boolean(),
  }),
  async ({ workBookId, isPublic }) => {
    const session = await getSession();

    await workBookService.toggleWorkBookPublic({
      workBookId,
      userId: session.user.id,
      isPublic,
    });
    return { isPublic, workBookId };
  },
);

export const toggleWorkBookLikeAction = safeAction(
  z.object({
    workBookId: z.string(),
  }),
  async ({ workBookId }) => {
    const session = await getSession();

    const { count, isLiked } = await workBookService.toggleLikeWorkBook(
      workBookId,
      session.user.id,
    );
    return { count, isLiked };
  },
);

export const copyWorkbookAction = safeAction(
  z.object({
    workBookId: z.string(),
  }),
  async ({ workBookId }) => {
    const session = await getSession();
    const newWorkBook = await workBookService.copyWorkBook({
      workBookId,
      userId: session.user.id,
    });
    return { copiedWorkBookId: newWorkBook.id };
  },
);

export const updateWorkBookCategoryAction = safeAction(
  z.object({
    workBookId: z.string(),
    categoryId: z.number(),
  }),
  async ({ categoryId, workBookId }) => {
    const session = await getSession();
    await workBookService.checkEditPermission(workBookId, session.user.id);
    await workBookService.updateWorkBookCategory({
      workBookId,
      categoryId,
    });

    return { categoryId };
  },
);
