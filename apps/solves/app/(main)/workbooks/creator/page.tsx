import { workBookService } from "@service/solves";
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
    <WorkbooksCreatorClient
      initialInProgressWorkbooks={inProgressWorkbooks}
      initialPublishedWorkbooks={publishedWorkbooks}
    />
  );
}
