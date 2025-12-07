import { workBookService } from "@service/solves";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { getSession } from "@/lib/auth/server";

export default async function InProgressWorkbooksPage() {
  const session = await getSession();
  const workBookSessions = await workBookService.searchWorkBookSessions(
    session.user.id,
  );
  return (
    <div className="w-full flex flex-col min-h-screen ">
      <div className="p-6 lg:p-10">
        <div className="font-bold text-foreground flex items-center justify-between gap-4 mb-6">
          <h1 className="text-xl shrink-0">문제집 검색</h1>
          <Input placeholder="키워드 검색" className="w-full lg:w-md" />
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-secondary/40 border-t p-6 lg:p-10 flex-1">
        {workBookSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ">
            {workBookSessions.map(({ workBook, session }) => (
              <Link
                href={`/workbooks/${workBook.id}/preview`}
                key={workBook.id}
              >
                <WorkbookCard workBook={workBook} session={session} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center flex-1">
            <h2 className="mb-2 text-2xl font-bold">
              아직 풀고 있는 문제집이 없습니다
            </h2>
            <p className="text-muted-foreground">문제집을 풀어보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
