import { workBookService } from "@service/solves";
import { notFound } from "next/navigation";
import z from "zod";
import { InDevelopment } from "@/components/ui/in-development";
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
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-8 space-y-4">
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-foreground">
                    문제집 제목
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    문제집 한줄 설명 어쩌구
                  </p>
                </div>
              </div>
              <InDevelopment className="h-screen">
                {JSON.stringify(book, null, 2)}
              </InDevelopment>
            </div>
          </div>
        </div>

        <div className="w-sm lg:w-md xl:w-lg p-2">
          <WorkbooksCreateChat threadId={id} workbookId={id} />
        </div>
      </div>
    </div>
  );
}
