"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Flag, MessageCircle, SendIcon, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

// 대댓글 타입
type Reply = {
  id: string;
  user: {
    name: string;
    initials: string;
    role?: "author"; // 나중에 갔다버려 
  };
  postedAt: string;
  body: string;
};

// 댓글 타입
type Comment = {
  id: string;
  user: {
    name: string;
    initials: string;
    role?: "author"; // 나중에 갔다버려 
  };
  postedAt: string;
  body: string;
  replies?: Reply[];
};

// 목업 데이터: API 연동 전까지 UI 미리보기용
const mockComments: Comment[] = [
  {
    id: "c1",
    user: { name: "전인산", initials: "전" },
    postedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    body: "서울의 수도면 강남 아님? 장난해?",
    replies: [
      {
        id: "c1-r1",
        user: { name: "최성근", initials: "최", role: "author" },
        postedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        body: "불편해? 불편하면 자세를 고쳐앉아",
      },
      {
        id: "c1-r2",
        user: { name: "조현재", initials: "조" },
        postedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        body: "서울은 나라 아닌가요??",
      },
    ],
  },
  {
    id: "c2",
    user: { name: "이수민", initials: "이"},
    postedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    body: "이수만 아니구요 이수민인데요 잘생긴 순서 4번문제 법적 소송 걸게요",
  },
  {
    id: "c3",
    user: { name: "박주창", initials: "박" },
    postedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    body: "문제 3번 키 183cm 안 되는 사람도 있음? 푸푸푸푸푸푸풉~~",
  },
  {
    id: "c4",
    user: { name: "다혜", initials: "다" },
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    body: "......잘...있...ㅈ..ㅣ...?",
  },
];

export function WorkbookCommentsPanel({
  open,
  onOpenChange,
  workbookTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workbookTitle?: string;
}) {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

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

    // 새 답글 생성
    const newReply: Reply = {
      id: `${commentId}-r${Date.now()}`,
      user: { name: "쓰는놈", initials: "쓰는놈" }, // useSession
      postedAt: new Date().toISOString(),
      body: text,
    };

    // 댓글 목록 업데이트
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply],
          };
        }
        return comment;
      })
    );

    // 입력 필드 초기화 및 답글 모드 종료
    setReplyText((prev) => ({ ...prev, [commentId]: "" }));
    setReplyingTo(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md px-0 pb-0">
        <SheetHeader className="px-4 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>풀이 댓글</SheetTitle>
              <SheetDescription>
                완료한 풀이에 대한 의견을 모아볼 수 있어요. (API 연동 예정)
              </SheetDescription>
            </div>
            <Badge variant="outline">베타화면임</Badge>
          </div>
          {workbookTitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {workbookTitle}
            </p>
          )}
        </SheetHeader>

        <div className="px-4 pb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{comments.length}개의 댓글</span>
        </div>

        <ScrollArea className="px-4 pb-6" style={{ height: "60vh" }}>
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
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
              />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-4 space-y-2 bg-muted/40">
          <Label className="text-sm font-medium flex items-center gap-2">
            새 댓글 작성
            <Badge variant="outline" className="text-2xs">
              곧 지원
            </Badge>
          </Label>
          <Textarea
            disabled
            rows={3}
            className="resize-none"
            placeholder="새로운 댓글을 작성하세요. (API 연결 후 활성화)"
          />
          <Button disabled className="w-full" variant="secondary">
            <SendIcon className="mr-2 h-4 w-4" />
            댓글 작성
          </Button>
          <p className="text-2xs text-muted-foreground">
            답글을 달려면 댓글 카드의 "답글 달기" 버튼을 눌러주세요.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CommentCard({
  comment,
  isRepliesOpen,
  onToggleReplies,
  isReplyingTo,
  onReplyClick,
  onCancelReply,
  replyText,
  onReplyTextChange,
  onSubmitReply,
}: {
  comment: Comment;
  isRepliesOpen: boolean;
  onToggleReplies: () => void;
  isReplyingTo: boolean;
  onReplyClick: () => void;
  onCancelReply: () => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(comment.postedAt), {
    addSuffix: true,
    locale: ko,
  });
  const hasReplies = Boolean(comment.replies?.length);

  return (
    <div className="rounded-lg border bg-muted/30 p-3 shadow-sm">
      <div className="flex w-full items-start gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {comment.user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-none">
              {comment.user.name}
            </p>
            {comment.user.role === "author" && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                문제집 작성자
              </Badge>
            )}
            {hasReplies && (
              <Badge variant="secondary" className="text-xs">
                대댓글 {comment.replies?.length ?? 0}개
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-2xs text-muted-foreground hover:text-foreground"
            >
              <Flag className="mr-1 h-3 w-3" />
              신고하기
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {comment.body}
          </p>
          {hasReplies && (
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

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onReplyClick}
        >
          <MessageCircle className="mr-1 h-3 w-3" />
          답글 달기
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          <ThumbsUp className="mr-1 h-3 w-3" />
          좋아요
        </Button>
      </div>

      {isReplyingTo && (
        <div className="mt-3 space-y-2 rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              {comment.user.name}님에게 답글 작성
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
            onChange={(e) => onReplyTextChange(e.target.value)}
            rows={2}
            className="resize-none text-sm"
            placeholder="답글을 입력하세요..."
            autoFocus
          />
          <Button
            onClick={onSubmitReply}
            disabled={!replyText.trim()}
            size="sm"
            className="w-full"
          >
            <SendIcon className="mr-2 h-3 w-3" />
            답글 작성
          </Button>
        </div>
      )}

      {comment.replies?.length && isRepliesOpen ? (
        <div className="mt-3 space-y-3 border-l pl-4">
          {comment.replies.map((reply) => (
            <ReplyCard key={reply.id} comment={reply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReplyCard({ comment }: { comment: Reply }) {
  const timeAgo = formatDistanceToNow(new Date(comment.postedAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-foreground/80 text-sm font-semibold">
            {comment.user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-none">
              {comment.user.name}
            </p>
            {comment.user.role === "author" && (
              <Badge variant="outline" className="text-2xs text-muted-foreground">
                문제집 작성자
              </Badge>
            )}
            <Badge variant="secondary" className="text-2xs">
              답글
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-2xs text-muted-foreground hover:text-foreground"
            >
              <Flag className="mr-1 h-3 w-3" />
              신고하기
            </Button>
          </div>
          <p className="text-2xs text-muted-foreground">{timeAgo}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {comment.body}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-2xs text-muted-foreground hover:text-foreground"
            >
              <ThumbsUp className="mr-1 h-3 w-3" />
              좋아요
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
