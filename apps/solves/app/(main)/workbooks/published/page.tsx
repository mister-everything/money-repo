import { workBookService } from "@service/solves";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth/server";

export default async function WorkbooksPublishedPage() {
  const session = await getSession();
  const workBooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
    isPublished: true,
  });
  return (
    <div>
      {!workBooks.length ? (
        <div className="w-full h-full p-8 text-xl font-bold">
          아직 없어요 배포하신게
        </div>
      ) : (
        workBooks.map((book) => (
          <Link href={`/workbooks/${book.id}/preview`} key={book.id}>
            <Card>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{book.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
