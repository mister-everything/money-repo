import { workBookService } from "@service/solves";
import Link from "next/link";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { getSession } from "@/lib/auth/server";

export default async function WorkbooksPublishedPage() {
  const session = await getSession();
  const workBooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    isPublished: true,
  });
  return (
    <div className="p-4">
      {!workBooks.length ? (
        <div className="w-full h-full p-8 text-xl font-bold">
          아직 없어요 배포하신게
        </div>
      ) : (
        workBooks.map((book) => (
          <Link href={`/workbooks/${book.id}/preview`} key={book.id}>
            <WorkbookCard book={book} />
          </Link>
        ))
      )}
    </div>
  );
}
