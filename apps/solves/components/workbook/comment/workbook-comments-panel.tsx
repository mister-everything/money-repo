"use client";

import { validateComment } from "@service/auth/shared";
import {
  COMMENT_REPORT_REASON_SECTIONS,
  ReportCategoryDetail,
  ReportTargetType,
} from "@service/report/shared";
import {
  PaginatedFlatCommentsResponse,
  WorkbookComment,
  WorkbookCommentWithReplies,
} from "@service/solves/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CornerDownRightIcon,
  Flag,
  Loader,
  Pencil,
  SendIcon,
  ThumbsUp,
  Trash2,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCommentAction,
  deleteCommentAction as deleteCommentServerAction,
  toggleCommentLikeAction,
  updateCommentAction as updateCommentServerAction,
} from "@/actions/comment";
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
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth/client";
import { fetcher } from "@/lib/protocol/fetcher";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { notify } from "../../ui/notify";

const BEST_COMMENT_THRESHOLD = 10;

function commentToTree(
  comments: WorkbookComment[],
): WorkbookCommentWithReplies[] {
  const commentMap = new Map<string, WorkbookCommentWithReplies>();
  const tree: WorkbookCommentWithReplies[] = [];

  // 먼저 모든 댓글을 맵에 추가 (replies 초기화)
  for (const comment of comments) {
    commentMap.set(comment.id, { ...comment, replies: [] });
  }

  // 부모-자식 관계 설정
  for (const comment of comments) {
    const node = commentMap.get(comment.id)!;
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(node);
      }
    } else {
      tree.push(node);
    }
  }

  return tree;
}

// WorkbookComment를 WithReplies로 변환
function toCommentWithReplies(
  comment: WorkbookComment,
): WorkbookCommentWithReplies {
  return { ...comment, replies: [] };
}

// 댓글 트리에서 특정 댓글 삭제
function removeCommentFromTree(
  comments: WorkbookCommentWithReplies[],
  commentId: string,
): WorkbookCommentWithReplies[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({
      ...c,
      replies: removeCommentFromTree(
        c.replies.map(toCommentWithReplies),
        commentId,
      ),
    }));
}

// 댓글 트리에서 특정 댓글 업데이트
function updateCommentInTree(
  comments: WorkbookCommentWithReplies[],
  commentId: string,
  newBody: string,
): WorkbookCommentWithReplies[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return { ...c, body: newBody, updatedAt: new Date() };
    }
    return {
      ...c,
      replies: updateCommentInTree(
        c.replies.map(toCommentWithReplies),
        commentId,
        newBody,
      ),
    };
  });
}

// 댓글 트리에서 좋아요 토글
function toggleLikeInTree(
  comments: WorkbookCommentWithReplies[],
  commentId: string,
): WorkbookCommentWithReplies[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return {
        ...c,
        isLikedByMe: !c.isLikedByMe,
        likeCount: c.isLikedByMe ? c.likeCount - 1 : c.likeCount + 1,
      };
    }
    return {
      ...c,
      replies: toggleLikeInTree(c.replies.map(toCommentWithReplies), commentId),
    };
  });
}

export function WorkbookCommentsPanel({
  workBookId,
  workbookTitle,
  children,
}: {
  workBookId: string;
  workbookTitle?: string;
  children: React.ReactNode;
}) {
  const [isFetching, setIsFetching] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [comments, setComments] = useState<WorkbookCommentWithReplies[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<WorkbookCommentWithReplies | null>(
    null,
  );

  // 마지막 액션 input 저장 (onSuccess에서 사용)
  const lastLikeRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<{ commentId: string; body: string } | null>(
    null,
  );
  const lastDeleteRef = useRef<string | null>(null);

  const commentFeedback = useMemo(() => {
    return validateComment(body).error;
  }, [body]);

  const fetchComments = useCallback(async () => {
    setIsFetching(true);
    const data = await fetcher<PaginatedFlatCommentsResponse>(
      `/api/workbooks/${workBookId}/comment`,
    ).finally(() => {
      setIsFetching(false);
    });
    setComments(commentToTree(data.comments));
  }, [workBookId]);

  // 새 댓글 작성
  const [, createComment, isCreating] = useSafeAction(createCommentAction, {
    successMessage: "댓글이 작성되었습니다",
    failMessage: (error) => {
      return error.message ?? "댓글 작성에 실패했습니다";
    },
    onSuccess: (newComment) => {
      if (newComment) {
        setComments((prev) => {
          if (newComment.parentId) {
            // 대댓글인 경우 부모 댓글의 replies에 추가
            const addReply = (
              comments: WorkbookCommentWithReplies[],
            ): WorkbookCommentWithReplies[] =>
              comments.map((c) => {
                if (c.id === newComment.parentId) {
                  return {
                    ...c,
                    replies: [...c.replies, newComment],
                  };
                }
                return {
                  ...c,
                  replies: addReply(c.replies.map(toCommentWithReplies)),
                };
              });
            return addReply(prev);
          }
          // 일반 댓글인 경우 맨 뒤에 추가
          return [...prev, toCommentWithReplies(newComment)];
        });
      }
      setBody("");
      setReplyTo(null);
      // 스크롤 맨 아래로
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    },
  });

  // 좋아요 토글
  const [, toggleLikeAction] = useSafeAction(toggleCommentLikeAction, {
    failMessage: "좋아요 처리에 실패했습니다",
    onSuccess: () => {
      if (lastLikeRef.current) {
        setComments((prev) => toggleLikeInTree(prev, lastLikeRef.current!));
        lastLikeRef.current = null;
      }
    },
  });

  // 댓글 수정
  const [, updateComment] = useSafeAction(updateCommentServerAction, {
    successMessage: "댓글이 수정되었습니다",
    failMessage: "댓글 수정에 실패했습니다",
    onSuccess: () => {
      if (lastUpdateRef.current) {
        setComments((prev) =>
          updateCommentInTree(
            prev,
            lastUpdateRef.current!.commentId,
            lastUpdateRef.current!.body,
          ),
        );
        lastUpdateRef.current = null;
      }
    },
  });

  // 댓글 삭제
  const [, deleteComment] = useSafeAction(deleteCommentServerAction, {
    successMessage: "댓글이 삭제되었습니다",
    failMessage: "댓글 삭제에 실패했습니다",
    onSuccess: () => {
      if (lastDeleteRef.current) {
        setComments((prev) =>
          removeCommentFromTree(prev, lastDeleteRef.current!),
        );
        lastDeleteRef.current = null;
      }
    },
  });

  const handleSubmitComment = () => {
    const text = body.trim();
    if (!text) return;
    createComment({
      workBookId,
      body: text,
      parentId: replyTo?.id,
    });
  };

  const handleToggleLike = (commentId: string) => {
    lastLikeRef.current = commentId;
    toggleLikeAction({ commentId });
  };

  const handleUpdateComment = (commentId: string, body: string) => {
    lastUpdateRef.current = { commentId, body };
    updateComment({ commentId, body });
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = await notify.confirm({ title: "정말 삭제하시겠습니까?" });
    if (!confirmed) return;
    lastDeleteRef.current = commentId;
    deleteComment({ commentId });
  };

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBody(e.target.value);
    },
    [],
  );

  useEffect(() => {
    if (workBookId && open) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workBookId, open]);

  return (
    <Drawer
      handleOnly
      direction="right"
      modal
      open={open}
      onOpenChange={setOpen}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="select-text! w-full xl:w-full! max-w-2xl! border-none! bg-transparent! p-4">
        <DrawerTitle className="sr-only">댓글</DrawerTitle>

        <div className="overflow-hidden w-full h-full flex flex-col bg-secondary/40 backdrop-blur-sm rounded-lg border">
          <div className="flex items-center justify-end p-4">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* 댓글 목록 */}
          <div
            className="flex-1 overflow-y-auto pt-0! p-6 space-y-4"
            ref={scrollRef}
          >
            {isFetching && comments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onReply={() => setReplyTo(comment)}
                  onToggleLike={handleToggleLike}
                  onUpdateComment={handleUpdateComment}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            )}
          </div>

          {/* 댓글 입력 */}
          <div className="p-4 flex flex-col gap-2">
            {replyTo && (
              <div className="flex items-center text-xs text-muted-foreground gap-1 p-2">
                <CornerDownRightIcon className="size-3" />
                <Avatar className="size-3 rounded-full">
                  <AvatarImage src={replyTo.authorProfile || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {replyTo.authorNickname?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-primary">
                  {replyTo.authorNickname ?? "알 수 없음"}
                </span>
                님에게 답글
                <XIcon
                  className="ml-auto size-3 cursor-pointer hover:text-primary"
                  onClick={() => setReplyTo(null)}
                />
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                value={body}
                onChange={handleBodyChange}
                rows={2}
                className="resize-none flex-1 bg-secondary rounded-lg text-sm"
                placeholder={
                  replyTo ? "답글을 작성하세요..." : "새로운 댓글을 작성하세요."
                }
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleSubmitComment}
                disabled={
                  !body.trim() || isCreating || Boolean(commentFeedback)
                }
              >
                {isCreating ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            {commentFeedback && Boolean(body.trim()) && (
              <p className="text-xs text-destructive">{commentFeedback}</p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
//----------------------------댓글 컴포넌트--------------------------------------------------
function Comment({
  comment,
  depth = 0,
  maxReplyDepth = 1,
  onReply,
  onToggleLike,
  onUpdateComment,
  onDeleteComment,
}: {
  comment: WorkbookCommentWithReplies;
  depth?: number;
  maxReplyDepth?: number;
  onReply?: () => void;
  onToggleLike: (commentId: string) => void;
  onUpdateComment: (commentId: string, body: string) => void;
  onDeleteComment: (commentId: string) => void;
}) {
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
          <div className="space-y-2">
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
          <p className="text-sm whitespace-pre-line">{comment.body}</p>
        )}

        {!isEditing && (
          <div className="flex items-center text-muted-foreground gap-2 mt-1">
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

            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs! p-0! h-auto! hover:bg-transparent!"
                >
                  <Pencil className="size-3 mr-1" />
                  수정
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteComment(comment.id)}
                  className="text-xs! p-0! h-auto! hover:bg-transparent! hover:text-destructive"
                >
                  <Trash2 className="size-3 mr-1" />
                  삭제
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-xs! p-0! h-auto! hover:bg-transparent! ml-auto"
              onClick={() => setReportOpen(true)}
            >
              <Flag className="size-3" />
            </Button>
          </div>
        )}

        {/* 대댓글 렌더링 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 border-l border-border/30 pl-4 space-y-3">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={toCommentWithReplies(reply)}
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
