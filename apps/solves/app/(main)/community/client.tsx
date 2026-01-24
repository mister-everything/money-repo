"use client";
import { CommunityComment } from "@service/solves";
import dynamic from "next/dynamic";
import { useState } from "react";
import { CommentForm } from "@/components/community/comment-form";
import { CommentItem } from "@/components/community/comment-item";
import { GoBackButton } from "@/components/layouts/go-back-button";

import { GradualSpacingText } from "@/components/ui/gradual-spacing-text";
import { SidebarController } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const FaultyTerminal = dynamic(
  () => import("@/components/ui/faulty-terminal").then((mod) => mod.default),
  {
    loading: () => null,
    ssr: false,
  },
);

export function CommunityClient({
  initialComments = [],
  hasSession = false,
  isAdmin = false,
}: {
  initialComments: (CommunityComment & { isOwner: boolean })[];
  hasSession: boolean;
  isAdmin: boolean;
}) {
  const [comments, setComments] = useState<
    (CommunityComment & { isOwner: boolean })[]
  >(() => initialComments);

  return (
    <div className="flex flex-col relative h-full overflow-hidden bg-background">
      <SidebarController openMounted={false} openUnmounted={true} />
      <div className="absolute inset-0 w-full h-full opacity-50">
        <FaultyTerminal mouseReact={false} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 50% 50%, var(--background) 0%, var(--background) 20%, transparent 70%)",
          }}
        />
      </div>

      <div className="absolute top-0 left-0 z-20 p-4">
        <GoBackButton>뒤로가기</GoBackButton>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none bg-linear-to-t from-background via-background/80 to-transparent z-20" />
      <div className="h-full z-10 overflow-y-auto relative py-12">
        <div
          className={cn(
            "container max-w-7xl mx-auto px-4 pb-32",
            comments.length === 0 && "flex items-center justify-center",
          )}
        >
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto pt-6 pb-2">
              <p className="text-sm text-foreground">
                <GradualSpacingText text="서비스에 대한 의견 또는 자유로운 이야기를 나눠보세요." />
              </p>
              <span className="text-xs text-muted-foreground">
                24시간 1회 작성
              </span>
            </div>

            {comments.length === 0 ? (
              <div className="p-8 text-center text-foreground">
                아직 작성된 댓글이 없어요.
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-2">
                {comments.map((comment, index) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    isOwner={comment.isOwner}
                    isAdmin={isAdmin}
                    index={index}
                    onDelete={() => {
                      setComments(comments.filter((c) => c.id !== comment.id));
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto absolute bottom-12 left-0 right-0 z-30">
        <CommentForm
          hasSession={hasSession}
          onCreateComment={(newComment) => {
            setComments([{ ...newComment, isOwner: true }, ...comments]);
          }}
        />
      </div>
    </div>
  );
}
