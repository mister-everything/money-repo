import { workBookService } from "@service/solves";
import Link from "next/link";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { getSession } from "@/lib/auth/server";

export default async function WorkbooksPage() {
  const session = await getSession();
  const inProgressWorkbooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    isPublished: false,
    limit: 3,
  });
  const publishedWorkbooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    isPublished: true,
  });

  return (
    <div className="p-6 lg:p-8 w-full">
      {inProgressWorkbooks.length > 0 && (
        <div className="flex flex-col gap-3 mb-12">
          <label className="text-sm font-bold text-foreground">진행중</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressWorkbooks.map((book) => (
              <Link href={`/workbooks/${book.id}/edit`} key={book.id}>
                <WorkbookCard workBook={book} />
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 mb-6">
        <label className="text-sm font-bold text-foreground">다만든거</label>
        {publishedWorkbooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedWorkbooks.map((book) => (
              <Link href={`/workbooks/${book.id}/report`} key={book.id}>
                <WorkbookCard workBook={book} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-18 w-full h-full flex items-center justify-center">
            <p>아직 배포된 문제집이 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
