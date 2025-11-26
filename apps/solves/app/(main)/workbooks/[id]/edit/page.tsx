import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import z from "zod";
import { GoBackButton } from "@/components/layouts/go-back-button";

import { WorkbookEdit } from "@/components/workbook/workbook-edit";
import { WorkbooksCreateChat } from "@/components/workbook/workbook-edit-chatbot";
import { getSession } from "@/lib/auth/server";

export default async function ProbEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();

  const hasPermission = await workBookService.isWorkBookOwner(
    z.uuid().parse(id),
    session.user.id,
  );
  if (!hasPermission) return notFound();

  const book = await workBookService.selectWorkBookById(id);
  if (!book) notFound();

  return (
    <div className="flex w-full h-screen px-4 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="w-full py-2">
          <GoBackButton>처음부터 다시 만들기</GoBackButton>
        </div>

        <WorkbookEdit book={book} />
      </div>

      <div className="w-sm lg:w-md xl:w-lg p-2">
        <WorkbooksCreateChat threadId={id} workbookId={id} />
      </div>
    </div>
  );
}
