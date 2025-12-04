import { workBookService } from "@service/solves";
import { isPublished } from "@service/solves/shared";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { WorkbookCreateForm } from "@/components/workbook/workbook-create-form";
import { getSession } from "@/lib/auth/server";

export default async function ProbCreatePage() {
  const session = await getSession();

  const isMaxInprogressWorkbookCreateCount =
    await workBookService.isMaxInprogressWorkbookCreateCount(session.user.id);

  const latest3Workbooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    limit: 3,
    // 완성되지 않은 문제집이 최대 개수를 초과하면 완성되지 않은 문제집만 조회
    isPublished: isMaxInprogressWorkbookCreateCount ? false : undefined,
  });

  return (
    <div className="flex flex-col p-6 lg:p-8">
      <div className="w-max-3xl mx-auto flex flex-col">
        <WorkbookCreateForm
          isMaxInprogressWorkbookCreateCount={
            isMaxInprogressWorkbookCreateCount
          }
        />

        <div className="flex flex-col gap-1 mt-12">
          <Label className="font-semibold mb-4">
            {isMaxInprogressWorkbookCreateCount
              ? "만들고 있는 문제집"
              : "최근 생성한 문제집"}
          </Label>

          {latest3Workbooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {latest3Workbooks.map((book) => (
                <Link
                  href={`/workbooks/${book.id}/${isPublished(book) ? "preview" : "edit"}`}
                  key={book.id}
                >
                  <WorkbookCard key={book.id} book={book} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-18 w-full h-full flex items-center justify-center">
              <p>새로운 문제집을 만들어보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
