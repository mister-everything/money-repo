import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import z from "zod";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { SidebarController } from "@/components/ui/sidebar";
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
    <div className="flex w-full overflow-hidden h-full gap-4">
      <SidebarController openMounted={false} openUnmounted={true} />
      <div className="flex-1 h-full relative pt-14">
        <HeaderWithSidebarToggle className="absolute h-fit" />
        <WorkbookEdit key={id} book={workBook} blocks={blocks} />
      </div>
      <div className="hidden lg:block w-sm lg:w-lg xl:w-2xl 2xl:w-3xl h-full py-2 pr-2">
        <WorkbooksCreateChat workbookId={id} key={id} />
      </div>
    </div>
  );
}
