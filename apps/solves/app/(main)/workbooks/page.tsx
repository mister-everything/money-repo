import { workBookService } from "@service/solves";
import { WorkbooksClient } from "@/app/(main)/workbooks/client";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";

export const dynamic = "force-dynamic";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
  });

  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          문제 풀기
        </span>
      </HeaderWithSidebarToggle>
      <WorkbooksClient initialWorkBooks={workBooks} />
    </div>
  );
}
