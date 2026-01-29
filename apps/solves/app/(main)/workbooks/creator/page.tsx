import { workBookService } from "@service/solves";
import { SidebarHeaderLayout } from "@/components/layouts/sidebat-header-layout";
import { getSession } from "@/lib/auth/server";
import { WorkbooksCreatorClient } from "./client";

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
    <SidebarHeaderLayout menuName="내가 만든 문제집">
      <WorkbooksCreatorClient
        initialInProgressWorkbooks={inProgressWorkbooks}
        initialPublishedWorkbooks={publishedWorkbooks}
      />
    </SidebarHeaderLayout>
  );
}
