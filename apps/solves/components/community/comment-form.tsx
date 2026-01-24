"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCommunityCommentAction } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

export function CommentForm() {
  const router = useRouter();
  const [content, setContent] = useState("");

  const [, createComment, isPending] = useSafeAction(
    createCommunityCommentAction,
    {
      successMessage: "댓글이 작성되었어요.",
      failMessage: (error) => error.message || "댓글 작성에 실패했어요.",
      onSuccess: () => {
        setContent("");
        router.refresh();
      },
    },
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    createComment({ content: content.trim() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="space-y-2"
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘의 한마디를 남겨보세요..."
        maxLength={280}
        rows={2}
        disabled={isPending}
        className="resize-none"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {content.length}/280
        </span>
        <Button type="submit" disabled={!content.trim() || isPending} size="sm">
          작성하기
        </Button>
      </div>
    </form>
  );
}
