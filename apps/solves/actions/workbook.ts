"use server";

import { workBookService } from "@service/solves";
import { WorkBookBlock } from "@service/solves/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale/ko";
import z from "zod";
import { getSession } from "@/lib/auth/server";
import { fail, ok } from "@/lib/protocol/interface";
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
    const hasPermission = await workBookService.isWorkBookOwner(
      id,
      session.user.id,
    );
    if (!hasPermission) return fail("권한이 없습니다.");
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
    await workBookService.processUpdateBlocks(
      session.user.id,
      workbookId,
      deleteBlocks,
      saveBlocks,
    );
    return ok();
  },
);
