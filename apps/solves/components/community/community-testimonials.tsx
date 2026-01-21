"use client";

import { useRouter } from "next/navigation";
import { deleteCommunityCommentAction } from "@/actions/community";
import { TestimonialsColumn } from "@/components/ui/testimonials-columns-1";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

interface CommunityTestimonialsProps {
  firstColumn: Array<{
    text: string;
    image: string;
    name: string;
    role: string;
    commentId?: string;
    userId?: string;
  }>;
  secondColumn: Array<{
    text: string;
    image: string;
    name: string;
    role: string;
    commentId?: string;
    userId?: string;
  }>;
  thirdColumn: Array<{
    text: string;
    image: string;
    name: string;
    role: string;
    commentId?: string;
    userId?: string;
  }>;
  currentUserId: string;
}

export function CommunityTestimonials({
  firstColumn,
  secondColumn,
  thirdColumn,
  currentUserId,
}: CommunityTestimonialsProps) {
  const router = useRouter();

  const [, deleteComment] = useSafeAction(deleteCommunityCommentAction, {
    successMessage: "댓글이 삭제되었어요.",
    failMessage: (error) => error.message || "댓글 삭제에 실패했어요.",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = (commentId: string) => {
    if (!confirm("정말 삭제하시겠어요?")) return;
    deleteComment({ commentId });
  };

  return (
    <div className="flex justify-center gap-6 mt-10 mask-[linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[740px] overflow-hidden">
      <TestimonialsColumn
        testimonials={firstColumn}
        duration={80}
        currentUserId={currentUserId}
        onDelete={handleDelete}
      />
      {secondColumn.length > 0 && (
        <TestimonialsColumn
          testimonials={secondColumn}
          className="hidden md:block"
          duration={78}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      )}
      {thirdColumn.length > 0 && (
        <TestimonialsColumn
          testimonials={thirdColumn}
          className="hidden lg:block"
          duration={76}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
