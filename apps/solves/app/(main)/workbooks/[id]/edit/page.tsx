import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import z from "zod";
import { GoBackButton } from "@/components/layouts/go-back-button";
import { InDevelopment } from "@/components/ui/in-development";
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

  const hasPermission = await workBookService.isProbBookOwner(
    z.uuid().parse(id),
    session.user.id,
  );
  if (!hasPermission) return notFound();

  const book = await workBookService.selectProbBookById(id);
  if (!book) notFound();

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="w-full">
            <GoBackButton>처음부터 다시 만들기</GoBackButton>
          </div>
          <div className="flex-1 overflow-y-auto">
            <WorkbookEdit book={book} />
          </div>
        </div>

        <div className="w-sm lg:w-md xl:w-lg p-2">
          <WorkbooksCreateChat threadId={id} workbookId={id} />
        </div>
      </div>
    </div>
  );
}
