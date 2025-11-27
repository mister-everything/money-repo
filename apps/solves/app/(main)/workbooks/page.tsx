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

export default async function WorkbooksPage() {
  const session = await getSession();
  const workBooks = await workBookService.searchMyWorkBooks({
    userId: session.user.id,
  });
  return (
    <div>
      {workBooks.map((book) => (
        <Link href={`/workbooks/${book.id}/edit`} key={book.id}>
          <Card>
            <CardHeader>
              <CardTitle>{book.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{book.description}</CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
