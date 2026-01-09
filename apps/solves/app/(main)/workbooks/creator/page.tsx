import { workBookService } from "@service/solves";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
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
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          내가 만든 문제집
        </span>
      </HeaderWithSidebarToggle>
      <WorkbooksCreatorClient
        initialInProgressWorkbooks={inProgressWorkbooks}
        initialPublishedWorkbooks={publishedWorkbooks}
      />
    </div>
  );
}
