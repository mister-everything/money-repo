"use client";

import {
  COMMENT_REPORT_REASON_SECTIONS,
  ReportCategoryDetail,
  ReportTargetType,
} from "@service/report/shared";
import { PaginatedCommentsResponse } from "@service/solves/shared";
import { badWords, TIME } from "@workspace/util";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Flag,
  Loader,
  MessageCircle,
  Pencil,
  SendIcon,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  createCommentAction,
  deleteCommentAction,
  toggleCommentLikeAction,
  updateCommentAction,
} from "@/actions/comment";
import { createReportAction } from "@/actions/report";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/client";
import { fetcher } from "@/lib/protocol/fetcher";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { notify } from "../ui/notify";

type CommentWithReplies = CommentData & {
  replies: CommentData[];
};

const BEST_COMMENT_THRESHOLD = 10;

const validateComment = (text: string): { valid: boolean; error?: string } => {
  const lowerText = text.toLowerCase();
  for (const word of badWords) {
    if (lowerText.includes(word)) {
      return {
        valid: false,
        error: `비속어가 포함되어 있습니다: ${word}`,
      };
    }
  }
  return { valid: true };
};

export function WorkbookCommentsPanel({
  open,
  onOpenChange,
  workBookId,
  workbookTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workBookId: string;
  workbookTitle?: string;
}) {
  const { data: session } = authClient.useSession();

  const [isFetching, setIsFetching] = useState(false);

  const currentUserId = session?.user?.id;

  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [newCommentText, setNewCommentText] = useState("");

  const fetchComments = useCallback(async () => {
    setIsFetching(true);
    const data = await fetcher<PaginatedCommentsResponse>(
      `/api/workbooks/${workBookId}/comments`,
    ).finally(() => {
      setIsFetching(false);
    });
    setComments(data.comments);
  }, [workBookId]);

  const commentValidation = useMemo(() => {
    return validateComment(newCommentText);
  }, [newCommentText]);

  // 대댓글 포함 댓글 총 개수
  const totalCount = useMemo(() => {
    return comments.reduce((acc, c) => acc + 1 + c.replies.length, 0);
  }, [comments]);

  // 새 댓글 작성
  const [, createComment, isCreating] = useSafeAction(createCommentAction, {
    successMessage: "댓글이 작성되었습니다",
    failMessage: (error) => {
      return error.message ?? "댓글 작성에 실패했습니다";
    },
    onSuccess: () => {
      setNewCommentText("");
      fetchComments();
    },
  });

  // 좋아요 토글
  const [, toggleLike] = useSafeAction(toggleCommentLikeAction, {
    failMessage: "좋아요 처리에 실패했습니다",
    onSuccess: () => {
      fetchComments();
    },
  });

  // 댓글 수정
  const [, updateComment] = useSafeAction(updateCommentAction, {
    successMessage: "댓글이 수정되었습니다",
    failMessage: "댓글 수정에 실패했습니다",
    onSuccess: () => {
      fetchComments();
    },
  });

  // 댓글 삭제
  const [, deleteComment] = useSafeAction(deleteCommentAction, {
    successMessage: "댓글이 삭제되었습니다",
    failMessage: "댓글 삭제에 실패했습니다",
    onSuccess: () => {
      fetchComments();
    },
  });

  // flat 배열 → 트리 구조 변환 + 정렬 (좋아요 10개 이상 상단)
  const buildCommentTree = (flat: CommentData[]): CommentWithReplies[] => {
    const roots: CommentWithReplies[] = [];
    const replyMap: Record<string, CommentData[]> = {};

    for (const c of flat) {
      if (c.parentId) {
        if (!replyMap[c.parentId]) replyMap[c.parentId] = [];
        replyMap[c.parentId].push(c);
      } else {
        roots.push({ ...c, replies: [] });
      }
    }

    for (const root of roots) {
      root.replies = (replyMap[root.id] || []).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }

    // 정렬: 좋아요 10개 이상 상단, 나머지는 최신순
    return roots.sort((a, b) => {
      const aTop = a.likeCount >= BEST_COMMENT_THRESHOLD;
      const bTop = b.likeCount >= BEST_COMMENT_THRESHOLD;
      if (aTop && !bTop) return -1;
      if (!aTop && bTop) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const toggleReplies = (commentId: string) => {
    setOpenReplies((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
    setOpenReplies((prev) => ({ ...prev, [commentId]: true }));
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitReply = (commentId: string) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;
    createReply({ commentId, body: text });
  };

  const handleSubmitComment = () => {
    const text = newCommentText;
    if (!text) return;
    createComment({ workBookId, body: text });
  };

  const handleToggleLike = (commentId: string) => {
    toggleLike({ commentId });
  };

  const handleUpdateComment = (commentId: string, body: string) => {
    updateComment({ commentId, body });
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await notify.confirm({ title: "정말 삭제하시겠습니까?" });
    if (!confirmed) return;
    deleteComment({ commentId });
  };

  useEffect(() => {
    if (open && workBookId) {
      fetchComments({ workBookId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workBookId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md px-0 pb-0">
        <SheetHeader className="px-4 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>풀이 댓글</SheetTitle>
              <SheetDescription>
                완료한 풀이에 대한 의견을 모아볼 수 있어요.
              </SheetDescription>
            </div>
          </div>
          {workbookTitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {workbookTitle}
            </p>
          )}
        </SheetHeader>

        <div className="px-4 pb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{totalCount}개의 댓글</span>
          {isFetching && <Loader className="h-3 w-3 animate-spin" />}
        </div>

        <ScrollArea className="px-4 pb-6" style={{ height: "55vh" }}>
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isRepliesOpen={Boolean(openReplies[comment.id])}
                onToggleReplies={() => toggleReplies(comment.id)}
                isReplyingTo={replyingTo === comment.id}
                onReplyClick={() => handleReplyClick(comment.id)}
                onCancelReply={handleCancelReply}
                replyText={replyText[comment.id] || ""}
                onReplyTextChange={(text) =>
                  setReplyText((prev) => ({ ...prev, [comment.id]: text }))
                }
                onSubmitReply={() => handleSubmitReply(comment.id)}
                onToggleLike={handleToggleLike}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            ))}
            {!isFetching && comments.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-4 space-y-2 bg-muted/40">
          <Label className="text-sm font-medium">새 댓글 작성</Label>
          <Textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
            className="resize-none"
            placeholder="새로운 댓글을 작성하세요."
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newCommentText || isCreating || !commentValidation.valid}
            className="w-full"
            variant="secondary"
          >
            {isCreating ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="mr-2 h-4 w-4" />
            )}
            댓글 작성
          </Button>
          {!commentValidation.valid && (
            <p className="text-xs text-destructive">
              {commentValidation.error}
            </p>
          )}
          <p className="text-2xs text-muted-foreground">
            답글을 달려면 댓글 카드의 "답글 달기" 버튼을 눌러주세요.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
//----------------------------댓글카드--------------------------------------------------
function CommentCard({
  comment,
  currentUserId,
  workBookOwnerId,
  isRepliesOpen,
  onToggleReplies,
  isReplyingTo,
  onReplyClick,
  onCancelReply,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  isReplying,
  onToggleLike,
  onUpdateComment,
  onDeleteComment,
  isReply = false,
}: {
  comment: CommentData & { replies?: CommentData[] };
  currentUserId?: string;
  workBookOwnerId: string;
  isRepliesOpen?: boolean;
  onToggleReplies?: () => void;
  isReplyingTo?: boolean;
  onReplyClick?: () => void;
  onCancelReply?: () => void;
  replyText?: string;
  onReplyTextChange?: (text: string) => void;
  onSubmitReply?: () => void;
  isReplying?: boolean;
  onToggleLike: (commentId: string) => void;
  onUpdateComment: (commentId: string, body: string) => void;
  onDeleteComment: (commentId: string) => void;
  isReply?: boolean;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.body);
  const isDeleted = Boolean(comment.deletedAt);
  const isAuthor = currentUserId === comment.authorId;
  const isWorkBookOwner = comment.authorId === workBookOwnerId;

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: ko,
  });
  const hasReplies = comment.replies && comment.replies.length > 0;

  const replyValidation = useMemo(() => {
    return validateComment(replyText || "");
  }, [replyText]);

  const editValidation = useMemo(() => {
    return validateComment(editText || "");
  }, [editText]);

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        isReply ? "bg-background/60" : "bg-muted/30 shadow-sm",
      )}
    >
      <div className="flex w-full items-start gap-3">
        <Avatar className={cn(isReply ? "h-8 w-8" : "h-9 w-9")}>
          {comment.authorImage && <AvatarImage src={comment.authorImage} />}
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-none">
              {comment.authorNickname ?? "알 수 없음"}
            </p>
            {isWorkBookOwner && (
              <Badge variant="default" className="text-2xs">
                작성자
              </Badge>
            )}
            {isReply && (
              <Badge variant="secondary" className="text-2xs">
                답글
              </Badge>
            )}
            {!isReply && hasReplies && (
              <Badge variant="secondary" className="text-xs">
                대댓글 {comment.replies?.length}개
              </Badge>
            )}
            {comment.likeCount >= BEST_COMMENT_THRESHOLD && (
              <Badge variant="outline" className="text-xs text-orange-500">
                인기
              </Badge>
            )}
            {!isDeleted && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-2xs text-muted-foreground hover:text-foreground"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="mr-1 h-3 w-3" />
                신고
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {timeAgo}
            {comment.editedAt && " (수정됨)"}
          </p>
          {isDeleted ? (
            <p className="text-sm text-muted-foreground italic">
              삭제된 댓글입니다.
            </p>
          ) : isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
              {!editValidation.valid && (
                <p className="text-xs text-destructive">
                  {editValidation.error}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className={cn("text-xs", isReply ? "h-6 text-2xs" : "h-7")}
                  onClick={() => {
                    onUpdateComment(comment.id, editText);
                    setIsEditing(false);
                  }}
                  disabled={!editText.trim() || !editValidation.valid}
                >
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn("text-xs", isReply ? "h-6 text-2xs" : "h-7")}
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
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {comment.body}
            </p>
          )}
          {!isReply && hasReplies && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleReplies}
              className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground hover:bg-transparent underline-offset-2 hover:underline"
            >
              대댓글 {isRepliesOpen ? "접기" : "보기"}
            </Button>
          )}
        </div>
      </div>

      {!isDeleted && !isEditing && (
        <div
          className={cn(
            "flex items-center gap-2",
            isReply ? "justify-end gap-1 pt-1" : "mt-3",
          )}
        >
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onReplyClick}
            >
              <MessageCircle className="mr-1 h-3 w-3" />
              답글 달기
            </Button>
          )}
          {isAuthor && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  isReply ? "h-6 px-2 text-2xs" : "h-7 text-xs",
                )}
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-1 h-3 w-3" />
                수정
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-muted-foreground hover:text-destructive",
                  isReply ? "h-6 px-2 text-2xs" : "h-7 text-xs",
                )}
                onClick={() => onDeleteComment(comment.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                삭제
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              isReply ? "h-6 px-2 text-2xs" : "ml-auto h-7 text-xs",
              comment.isLikedByMe
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onToggleLike(comment.id)}
          >
            <ThumbsUp
              className={cn(
                "mr-1 h-3 w-3",
                comment.isLikedByMe && "fill-primary",
              )}
            />
            좋아요 {comment.likeCount > 0 && comment.likeCount}
          </Button>
        </div>
      )}

      {!isReply && isReplyingTo && (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              {comment.authorNickname ?? "알 수 없음"}님에게 답글 작성
            </Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={onCancelReply}
            >
              취소
            </Button>
          </div>
          <Textarea
            value={replyText}
            onChange={(e) => onReplyTextChange?.(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            placeholder="답글을 입력하세요..."
            autoFocus
          />
          <Button
            onClick={onSubmitReply}
            disabled={!replyText || isReplying || !replyValidation.valid}
            size="sm"
            className="w-full"
          >
            {isReplying ? (
              <Loader className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <SendIcon className="mr-2 h-3 w-3" />
            )}
            답글 작성
          </Button>
          {!replyValidation.valid && (
            <p className="text-xs text-destructive">{replyValidation.error}</p>
          )}
        </div>
      )}

      {!isReply &&
        isRepliesOpen &&
        comment.replies &&
        comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l pl-4">
            {comment.replies.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                workBookOwnerId={workBookOwnerId}
                onToggleLike={onToggleLike}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
                isReply={true}
              />
            ))}
          </div>
        )}

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
