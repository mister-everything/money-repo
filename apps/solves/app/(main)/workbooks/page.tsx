import { workBookService } from "@service/solves";
import { WorkbooksClient } from "@/app/(main)/workbooks/client";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
  });

  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle />
      <WorkbooksClient initialWorkBooks={workBooks} />
    </div>
  );
}
