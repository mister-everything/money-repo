import { workBookService } from "@service/solves";
import { WorkbooksClient } from "@/app/(main)/workbooks/client";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
  });

  return <WorkbooksClient initialWorkBooks={workBooks} />;
}
