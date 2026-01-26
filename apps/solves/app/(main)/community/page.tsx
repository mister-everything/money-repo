import { Role } from "@service/auth/shared";
import { communityService } from "@service/solves";
import { safeGetSession } from "@/lib/auth/server";
import { CommunityClient } from "./client";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await safeGetSession();

  const hasSession = !!session?.user;
  const comments = await communityService.listComments({ limit: 50 });

  return (
    <CommunityClient
      initialComments={comments.map((comment) => ({
        ...comment,
        isOwner: comment.ownerPublicId === session?.user?.publicId,
      }))}
      hasSession={hasSession}
      isAdmin={session?.user?.role === Role.ADMIN}
    />
  );
}
