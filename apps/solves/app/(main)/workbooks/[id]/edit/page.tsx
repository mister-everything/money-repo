import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import z from "zod";
import { WorkbookEdit } from "@/components/workbook/workbook-edit";
import { WorkbooksCreateChat } from "@/components/workbook/workbook-edit-chatbot";
import { getSession } from "@/lib/auth/server";

export default async function WorkbookEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();

  await workBookService.checkEditPermission(
    z.uuid().parse(id),
    session.user.id,
  );

  const book = await workBookService.getWorkBookWithBlocks(id);
  if (!book) notFound();

  return (
    <div className="flex w-full h-screen px-4 gap-4">
      <div className="flex-1 h-full overflow-hidden">
        <WorkbookEdit book={book} />
      </div>
      <div className="hidden lg:block w-sm lg:w-md xl:w-lg 2xl:w-2xl h-full overflow-hidden p-2">
        <WorkbooksCreateChat workbookId={id} />
      </div>
    </div>
  );
}
