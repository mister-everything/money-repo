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
  const { blocks, ...workBook } = book;

  return (
    <div className="flex w-full h-screen px-4 gap-4">
      <div className="flex-1 h-full overflow-hidden">
        <WorkbookEdit key={id} book={workBook} blocks={blocks} />
      </div>
      <div className="hidden lg:block w-sm lg:w-lg xl:w-2xl 2xl:w-3xl h-full overflow-hidden p-2">
        <WorkbooksCreateChat workbookId={id} key={id} />
      </div>
    </div>
  );
}
