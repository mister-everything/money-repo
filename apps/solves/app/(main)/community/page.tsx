import { userService } from "@service/auth";
import { communityService } from "@service/solves";
import { CommentForm } from "@/components/community/comment-form";
import { CommentItem } from "@/components/community/comment-item";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await getSession();
  const comments = await communityService.listComments({ limit: 50 });
  const isAdmin = await userService.isAdmin(session.user.id);

  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          커뮤니티
        </span>
      </HeaderWithSidebarToggle>
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Small Talk</h1>
            <p className="text-sm text-muted-foreground">
              서비스에 대한 의견 또는 자유로운 이야기를 나눠보세요.
              <br />
              24시간에 한 번만 작성할 수 있어요.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <CommentForm />
          </div>

          <div className="space-y-0 border rounded-lg divide-y">
            {comments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                아직 작성된 댓글이 없어요.
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={session.user.id}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
