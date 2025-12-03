"use server";

import { workBookService } from "@service/solves";
import { WorkBookBlock } from "@service/solves/shared";
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
    saveBlocks,
  }: {
    workbookId: string;
    deleteBlocks: string[];
    saveBlocks: WorkBookBlock[];
  }) => {
    const session = await getSession();
    await workBookService.checkEditPermission(workbookId, session.user.id);
    await workBookService.processUpdateBlocks(
      workbookId,
      deleteBlocks,
      saveBlocks,
    );
    return ok();
  },
);

export const publishWorkbookAction = safeAction(async (workbookId: string) => {
  const session = await getSession();
  await workBookService.checkEditPermission(workbookId, session.user.id);
  await workBookService.publishWorkbook(workbookId);
  return ok();
});
