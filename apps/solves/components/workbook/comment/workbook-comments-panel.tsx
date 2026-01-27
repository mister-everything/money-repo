"use client";

import { validateComment } from "@service/auth/shared";
import {
  PaginatedFlatCommentsResponse,
  WorkbookComment,
  WorkbookCommentWithReplies,
} from "@service/solves/shared";
import {
  AlertTriangleIcon,
  CornerDownRightIcon,
  Loader,
  SendIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCommentAction,
  deleteCommentAction as deleteCommentServerAction,
  toggleCommentLikeAction,
  updateCommentAction as updateCommentServerAction,
} from "@/actions/comment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/protocol/fetcher";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { notify } from "../../ui/notify";
import { Comment } from "./workbook-comment";

// 플랫 댓글 목록을 트리 구조로 변환
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

// 댓글 트리에 새 댓글 추가
function addCommentToTree(
  comments: WorkbookCommentWithReplies[],
  newComment: WorkbookComment,
): WorkbookCommentWithReplies[] {
  if (!newComment.parentId) {
    // 루트 댓글
    return [...comments, { ...newComment, replies: [] }];
  }

  // 대댓글 - 부모 찾아서 추가
  return comments.map((c) => {
    if (c.id === newComment.parentId) {
      return {
        ...c,
        replies: [...c.replies, newComment],
      };
    }
    return c;
  });
}

// 댓글 트리에서 특정 댓글 삭제
function removeCommentFromTree(
  comments: WorkbookCommentWithReplies[],
  commentId: string,
): WorkbookCommentWithReplies[] {
  // 먼저 루트 레벨에서 삭제 시도
  const filtered = comments.filter((c) => c.id !== commentId);

  // 대댓글에서도 삭제
  return filtered.map((c) => ({
    ...c,
    replies: c.replies.filter((r) => r.id !== commentId),
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
      replies: c.replies.map((r) =>
        r.id === commentId ? { ...r, body: newBody, updatedAt: new Date() } : r,
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
      replies: c.replies.map((r) =>
        r.id === commentId
          ? {
              ...r,
              isLikedByMe: !r.isLikedByMe,
              likeCount: r.isLikedByMe ? r.likeCount - 1 : r.likeCount + 1,
            }
          : r,
      ),
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
    try {
      const data = await fetcher<PaginatedFlatCommentsResponse>(
        `/api/workbooks/${workBookId}/comment`,
      );
      setComments(commentToTree(data.comments));
    } finally {
      setIsFetching(false);
    }
  }, [workBookId]);

  // 새 댓글 작성
  const [, createComment, isCreating] = useSafeAction(createCommentAction, {
    successMessage: "댓글이 작성되었습니다",
    failMessage: (error) => {
      return error.message ?? "댓글 작성에 실패했습니다";
    },
    onSuccess: (newComment) => {
      if (newComment) {
        setComments((prev) => addCommentToTree(prev, newComment));
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
      const commentId = lastLikeRef.current;
      if (commentId) {
        setComments((prev) => toggleLikeInTree(prev, commentId));
        lastLikeRef.current = null;
      }
    },
  });

  // 댓글 수정
  const [, updateComment] = useSafeAction(updateCommentServerAction, {
    successMessage: "댓글이 수정되었습니다",
    failMessage: "댓글 수정에 실패했습니다",
    onSuccess: () => {
      const input = lastUpdateRef.current;
      if (input) {
        setComments((prev) =>
          updateCommentInTree(prev, input.commentId, input.body),
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
      const commentId = lastDeleteRef.current;
      if (commentId) {
        setComments((prev) => removeCommentFromTree(prev, commentId));
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

  const handleToggleLike = useCallback(
    (commentId: string) => {
      lastLikeRef.current = commentId;
      toggleLikeAction({ commentId });
    },
    [toggleLikeAction],
  );

  const handleUpdateComment = useCallback(
    (commentId: string, body: string) => {
      lastUpdateRef.current = { commentId, body };
      updateComment({ commentId, body });
    },
    [updateComment],
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      const confirmed = await notify.confirm({
        title: "정말 삭제하시겠습니까?",
      });
      if (!confirmed) return;
      lastDeleteRef.current = commentId;
      deleteComment({ commentId });
    },
    [deleteComment],
  );

  const handleBodyChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBody(e.target.value);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !e.nativeEvent.isComposing &&
        Boolean(body.trim()) &&
        !commentFeedback
      ) {
        e.preventDefault();
        handleSubmitComment();
      }
    },
    [handleSubmitComment, body, commentFeedback],
  );

  useEffect(() => {
    if (workBookId && open) {
      fetchComments();
    }
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
              <div className="flex flex-col py-8 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
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

          <div className="p-4">
            <div className="border flex flex-col gap-2 rounded-xl bg-background overflow-hidden">
              {replyTo && (
                <div
                  className="flex items-center bg-secondary text-xs text-muted-foreground gap-1 cursor-pointer hover:bg-input p-4"
                  onClick={() => setReplyTo(null)}
                >
                  <CornerDownRightIcon className="size-3" />
                  <Avatar className="size-3 rounded-full">
                    <AvatarImage src={replyTo.authorProfile || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {replyTo.authorNickname?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">
                    {replyTo.authorNickname ?? "알 수 없음"}
                  </span>
                  님에게 답글
                  <XIcon className="ml-auto size-3 cursor-pointer hover:text-primary" />
                </div>
              )}
              {commentFeedback && Boolean(body.trim()) && (
                <p className="text-xs text-muted-foreground p-4 flex items-center gap-1">
                  <AlertTriangleIcon className="size-2.5" />
                  {commentFeedback}
                </p>
              )}
              <div className="flex p-2 items-end">
                <Textarea
                  value={body}
                  onChange={handleBodyChange}
                  onKeyDown={handleKeyDown}
                  className="max-h-40 resize-none flex-1 bg-transparent! border-none! focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                  placeholder={
                    replyTo
                      ? "답글을 작성하세요..."
                      : "새로운 댓글을 작성하세요."
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
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
