import { userService } from "@service/auth";
import { communityService } from "@service/solves";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { CommentForm } from "@/components/community/comment-form";
import { CommunityTestimonials } from "@/components/community/community-testimonials";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await getSession();
  const comments = await communityService.listComments({ limit: 50 });
  const isAdmin = await userService.isAdmin(session.user.id);

  // 댓글을 testimonials 형식으로 변환
  const testimonials = comments.map((comment) => ({
    text: comment.content,
    image: comment.user.image || "",
    name: comment.user.nickname || "익명 사용자",
    role: formatDistanceToNow(new Date(comment.createdAt), {
      addSuffix: true,
      locale: ko,
    }),
    commentId: comment.id,
    userId: comment.userId,
  }));

  // 3개 컬럼으로 나누기
  const firstColumn = testimonials.slice(0, Math.ceil(testimonials.length / 3));
  const secondColumn = testimonials.slice(
    Math.ceil(testimonials.length / 3),
    Math.ceil((testimonials.length * 2) / 3),
  );
  const thirdColumn = testimonials.slice(
    Math.ceil((testimonials.length * 2) / 3),
  );

  return (
    <div className="flex flex-col">
      <HeaderWithSidebarToggle>
        <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
          커뮤니티
        </span>
      </HeaderWithSidebarToggle>
      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Small Talk</h1>
            <p className="text-sm text-muted-foreground">
              서비스에 대한 의견 또는 자유로운 이야기를 나눠보세요.
              <br />
              24시간에 한 번만 작성할 수 있어요.
            </p>
          </div>

          <div className="border rounded-lg p-4 max-w-2xl mx-auto">
            <CommentForm />
          </div>

          {testimonials.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              아직 작성된 댓글이 없어요.
            </div>
          ) : (
            <CommunityTestimonials
              firstColumn={firstColumn}
              secondColumn={secondColumn}
              thirdColumn={thirdColumn}
              currentUserId={session.user.id}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    </div>
  );
}
