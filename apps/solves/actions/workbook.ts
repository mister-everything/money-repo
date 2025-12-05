"use server";

import { workBookService } from "@service/solves";
import { UpdateBlock, WorkBookBlock } from "@service/solves/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale/ko";
import z from "zod";
import { getSession } from "@/lib/auth/server";
import { ok } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

const generateDefaultTitle = () => {
  return `${formatDistanceToNow(new Date(), {
    addSuffix: true,
    locale: ko,
  })} 문제집`;
};

export const createWorkbookAction = safeAction(async (formData: FormData) => {
  const session = await getSession();

  const savedWorkBook = await workBookService.createWorkBook({
    title: (formData.get("title") as string) || generateDefaultTitle(),
    ownerId: session.user.id,
  });

  return savedWorkBook;
});

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
    return ok();
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
    return ok();
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
    return ok();
  },
);
