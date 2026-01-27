"use client";

import { validateComment } from "@service/auth/shared";
import {
  COMMENT_REPORT_REASON_SECTIONS,
  ReportCategoryDetail,
  ReportTargetType,
} from "@service/report/shared";
import { WorkbookCommentWithReplies } from "@service/solves/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CornerDownRightIcon,
  Flag,
  Loader,
  MoreHorizontalIcon,
  Pencil,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createReportAction } from "@/actions/report";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";

const BEST_COMMENT_THRESHOLD = 10;

export interface CommentProps {
  comment: WorkbookCommentWithReplies;
  depth?: number;
  maxReplyDepth?: number;
  onReply?: () => void;
  onToggleLike: (commentId: string) => void;
  onUpdateComment: (commentId: string, body: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function Comment({
  comment,
  depth = 0,
  maxReplyDepth = 1,
  onReply,
  onToggleLike,
  onUpdateComment,
  onDeleteComment,
}: CommentProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);

  const isOwner = comment.isCommentAuthor ?? false;

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ko,
  });

  const editValidation = useMemo(() => {
    return validateComment(editText || "");
  }, [editText]);

  const handleSaveEdit = () => {
    if (!editText.trim() || !editValidation.valid) return;
    onUpdateComment(comment.id, editText);
    setIsEditing(false);
  };

  // comment.body가 바뀌면 editText도 동기화
  useEffect(() => {
    setEditText(comment.body);
  }, [comment.body]);

  return (
    <div className="flex items-start gap-3">
      <Avatar className="size-6 rounded-full">
        <AvatarImage src={comment.authorProfile || undefined} />
        <AvatarFallback className="text-xs">
          {comment.authorNickname?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-xs">
            {comment.authorNickname ?? "알 수 없음"}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo}
            {comment.updatedAt && " (수정됨)"}
          </span>
          {comment.likeCount >= BEST_COMMENT_THRESHOLD && (
            <Badge variant="outline" className="text-2xs text-orange-500">
              인기
            </Badge>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 my-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              autoFocus
            />
            {!editValidation.valid && (
              <p className="text-xs text-destructive">{editValidation.error}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-xs"
                onClick={handleSaveEdit}
                disabled={!editText.trim() || !editValidation.valid}
              >
                저장
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => {
                  setEditText(comment.body);
                  setIsEditing(false);
                }}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-line break-words">
            {comment.body}
          </p>
        )}

        {!isEditing && (
          <div className="flex items-center text-muted-foreground gap-3 mt-1">
            {depth < maxReplyDepth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply?.()}
                className="text-xs! p-0! h-auto! hover:bg-transparent!"
              >
                <CornerDownRightIcon className="size-3 mr-1" />
                답글
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs! p-0! h-auto! hover:bg-transparent!",
                comment.isLikedByMe && "text-primary",
              )}
              onClick={() => onToggleLike(comment.id)}
            >
              <ThumbsUp
                className={cn(
                  "size-3 mr-1",
                  comment.isLikedByMe && "fill-primary",
                )}
              />
              {comment.likeCount > 0 ? comment.likeCount : "좋아요"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs! p-0! h-auto! hover:bg-transparent!"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="size-3" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      <Trash2 className="size-3" />
                      삭제
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="size-3" />
                  신고
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* 대댓글 렌더링 (1depth만 지원) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 border-l border-border/30 pl-4 space-y-3">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={{ ...reply, replies: [] }}
                depth={depth + 1}
                maxReplyDepth={maxReplyDepth}
                onToggleLike={onToggleLike}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
              />
            ))}
          </div>
        )}
      </div>

      <CommentReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        commentId={comment.id}
      />
    </div>
  );
}

//----------------------------댓글신고--------------------------------------------------
function CommentReportDialog({
  open,
  onOpenChange,
  commentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: string;
}) {
  const [selectedReason, setSelectedReason] = useState<ReportCategoryDetail>();
  const [description, setDescription] = useState("");

  const selectedCategoryMain = useMemo(() => {
    if (!selectedReason) return undefined;
    for (const section of COMMENT_REPORT_REASON_SECTIONS) {
      if (
        section.reasons.some(
          (r: { detail: ReportCategoryDetail; label: string }) =>
            r.detail === selectedReason,
        )
      ) {
        return section.main;
      }
    }
    return undefined;
  }, [selectedReason]);

  const [, createReport, isPending] = useSafeAction(createReportAction, {
    successMessage: "신고가 접수되었습니다",
    failMessage: "신고 접수에 실패했습니다",
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const canSubmit = Boolean(
    selectedReason && selectedCategoryMain && description.trim().length > 0,
  );

  const handleSubmit = () => {
    if (!canSubmit || !selectedCategoryMain || !selectedReason) return;
    createReport({
      targetType: ReportTargetType.COMMENT,
      targetId: commentId,
      categoryMain: selectedCategoryMain,
      categoryDetail: selectedReason,
      detailText: description,
    });
  };

  useEffect(() => {
    if (!open) {
      setSelectedReason(undefined);
      setDescription("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>댓글 신고</DialogTitle>
          <DialogDescription>
            부적절한 댓글을 신고해주세요. 검토 후 조치하겠습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup
            value={selectedReason}
            onValueChange={(v) => setSelectedReason(v as ReportCategoryDetail)}
          >
            {COMMENT_REPORT_REASON_SECTIONS.map((section) => (
              <div key={section.main} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {section.heading}
                </p>
                {section.reasons.map(
                  (reason: { detail: ReportCategoryDetail; label: string }) => (
                    <label
                      key={reason.detail}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        selectedReason === reason.detail
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <RadioGroupItem value={reason.detail} />
                      <span className="text-sm">{reason.label}</span>
                    </label>
                  ),
                )}
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label>상세 내용</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="신고 사유를 자세히 작성해주세요."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            신고하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
