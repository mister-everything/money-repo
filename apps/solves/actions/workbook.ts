"use server";

import { probService } from "@service/solves";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale/ko";

import { getSession } from "@/lib/auth/server";
import { safeAction } from "@/lib/protocol/server-action";

const generateDefaultTitle = () => {
  return `${formatDistanceToNow(new Date(), {
    addSuffix: true,
    locale: ko,
  })} 문제집`;
};

export const createWorkbookAction = safeAction(async (formData: FormData) => {
  const session = await getSession();

  const savedProbBook = await probService.createProbBook({
    title: (formData.get("title") as string) || generateDefaultTitle(),
    ownerId: session.user.id,
  });

  return savedProbBook;
});
