import { workBookService } from "@service/solves";
import { WorkbooksClient } from "@/app/(main)/workbooks/client";
import { SidebarHeaderLayout } from "@/components/layouts/sidebat-header-layout";

export const dynamic = "force-dynamic";

export default async function Page() {
  const workBooks = await workBookService.searchWorkBooks({
    isPublished: true,
  });

  return (
    <SidebarHeaderLayout menuName="문제 풀기">
      <WorkbooksClient initialWorkBooks={workBooks} />
    </SidebarHeaderLayout>
  );
}
