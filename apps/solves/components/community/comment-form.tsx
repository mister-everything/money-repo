"use client";

import { CommunityComment } from "@service/solves";
import { ArrowUpIcon, LoaderIcon, LogIn } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { createCommunityCommentAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { Input } from "../ui/input";

export function CommentForm({
  hasSession = false,
  onCreateComment,
}: {
  hasSession?: boolean;

  onCreateComment?: (comment: CommunityComment) => void;
}) {
  const [content, setContent] = useState("");

  const [, createComment, isPending] = useSafeAction(
    createCommunityCommentAction,
    {
      successMessage: "댓글이 작성되었어요.",
      failMessage: (error) => error.message || "댓글 작성에 실패했어요.",
      onSuccess: (newComment) => {
        setContent("");
        onCreateComment?.(newComment);
      },
    },
  );

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isPending) return;
    createComment({ content: content.trim() });
  }, [content, createComment]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        createComment({ content: content.trim() });
      }
    },
    [content, createComment],
  );

  if (!hasSession) {
    return (
      <div className="bg-background flex items-center justify-between gap-3 border shadow-lg rounded-full p-4 px-6">
        <div className="flex items-center gap-2">
          <LogIn className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            로그인하고 이야기를 남겨보세요
          </span>
        </div>
        <Button asChild className="rounded-full" variant="default" size="sm">
          <Link href="/sign-in?callbackUrl=/community">로그인</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background flex items-center gap-2 border shadow-lg rounded-full p-2">
      <Input
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="오늘의 한마디를 남겨보세요..."
        maxLength={280}
        disabled={isPending}
        className="focus-visible:ring-0 ml-2 flex-1 focus-visible:ring-offset-0 border-none shadow-none bg-transparent!"
      />
      <div className="flex justify-between items-center">
        <Button
          className="rounded-full"
          variant="secondary"
          disabled={!content.trim() || isPending}
          size="icon"
          onClick={handleSubmit}
        >
          {isPending ? (
            <LoaderIcon className="animate-spin" />
          ) : (
            <ArrowUpIcon />
          )}
        </Button>
      </div>
    </div>
  );
}
