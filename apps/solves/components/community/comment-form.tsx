"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    createComment({ content: content.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘의 한마디를 남겨보세요..."
        maxLength={280}
        rows={3}
        disabled={isPending}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {content.length}/280
        </span>
        <Button type="submit" disabled={!content.trim() || isPending}>
          작성하기
        </Button>
      </div>
    </form>
  );
}
