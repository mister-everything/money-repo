import { workBookService } from "@service/solves";
import { WorkbookList } from "@/components/workbook/workbook-list";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
  });

  return <WorkbookList initialWorkBooks={workBooks} />;
}
