"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCommunityCommentAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { CommunityCommentWithUser } from "@service/solves";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentItemProps {
  comment: CommunityCommentWithUser;
  currentUserId: string;
  isAdmin: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  isAdmin,
}: CommentItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = comment.userId === currentUserId || isAdmin;

  const [, deleteComment] = useSafeAction(deleteCommunityCommentAction, {
    successMessage: "댓글이 삭제되었어요.",
    failMessage: (error) => error.message || "댓글 삭제에 실패했어요.",
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = () => {
    if (!canDelete || isDeleting) return;
    if (!confirm("정말 삭제하시겠어요?")) return;

    setIsDeleting(true);
    deleteComment({ commentId: comment.id });
  };

  const displayName =
    comment.user.nickname || comment.user.name || "익명 사용자";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-3 p-4 border-b last:border-b-0">
      <Avatar className="size-10">
        <AvatarImage src={comment.user.image || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="삭제"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
