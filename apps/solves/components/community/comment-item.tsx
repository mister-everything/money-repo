"use client";

import { Role } from "@service/auth/shared";
import { CommunityComment } from "@service/solves";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { deleteCommunityCommentAction } from "@/actions/community";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { BadgeCheckIcon } from "../ui/custom-icon";
import { notify } from "../ui/notify";

interface CommentItemProps {
  comment: CommunityComment;
  isOwner?: boolean;
  isAdmin?: boolean;
  index?: number;
  onDelete?: () => void;
}

export function CommentItem({
  comment,
  isOwner = false,
  isAdmin = false,
  index = 0,
  onDelete,
}: CommentItemProps) {
  const canDelete = isOwner || isAdmin;

  const [, deleteComment, isPending] = useSafeAction(
    deleteCommunityCommentAction,
    {
      successMessage: "댓글이 삭제되었어요.",
      failMessage: (error) => error.message || "댓글 삭제에 실패했어요.",
      onSuccess: () => {
        onDelete?.();
      },
    },
  );

  const handleDelete = async () => {
    if (!canDelete || isPending) return;
    const answer = await notify.confirm({ title: "정말 삭제하시겠어요?" });
    if (!answer) return;

    deleteComment({ commentId: comment.id });
  };

  const displayName = comment.ownerName || "익명 사용자";

  return (
    <div
      className={`group relative px-4 py-3 rounded-full
                 bg-card hover:bg-secondary/50 backdrop-blur-sm
                 border
                 transition-all duration-300 ease-out
                 hover:scale-[1.01] hover:shadow-sm
                 animate-in fade-in-0 slide-in-from-left-4`}
      style={{
        animationDelay: `${index * 80}ms`,
        animationDuration: "600ms",
        animationFillMode: "backwards",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* 유저 정보 (고정 width) */}
        <div className="flex items-center gap-2 shrink-0 w-32">
          {comment.ownerRole === Role.ADMIN && (
            <BadgeCheckIcon className="size-3.5 text-blue-500 shrink-0" />
          )}
          <Avatar className="size-5 shrink-0 ring-2 ring-border/50 transition-transform duration-300 group-hover:scale-110 group-hover:ring-border">
            <AvatarImage
              src={comment.ownerProfile || ""}
              alt={`${displayName} 프로필`}
              className="object-cover"
            />
            <AvatarFallback className="text-xs bg-secondary font-semibold">
              {displayName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-sm truncate">{displayName}</span>
          </div>
        </div>

        {/* 내용 */}
        <p className="text-sm text-foreground flex-1 min-w-0 line-clamp-1 group-hover:line-clamp-none transition-all">
          {comment.content}
        </p>

        {/* 시간 (호버시 왼쪽으로 밀림) */}
        <span className="text-xs text-muted-foreground/70 shrink-0 transition-all duration-200 group-hover:mr-8">
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </span>

        {/* 삭제 버튼 (호버시 나타남, 절대 위치) */}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="삭제"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
