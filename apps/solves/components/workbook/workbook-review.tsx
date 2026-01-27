"use client";
import {
  BlockAnswerSubmit,
  WorkBookReviewSession,
} from "@service/solves/shared";
import { CheckIcon, MessageCircle, Share2Icon } from "lucide-react";
import { useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { useCopy } from "@/hooks/use-copy";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { GradualSpacingText } from "../ui/gradual-spacing-text";
import { Block } from "./block/block";
import { WorkbookCommentsPanel } from "./comment/workbook-comments-panel";
import { WorkbookHeader } from "./workbook-header";
import { WorkBookLikeButton } from "./workbook-like-button";

interface WorkBookReviewProps {
  session: WorkBookReviewSession;
  commentCount: number;
}

export const WorkBookReview: React.FC<WorkBookReviewProps> = ({
  session,
  commentCount,
}) => {
  const submitAnswerByBlockId = session.submitAnswers.reduce(
    (acc, submitAnswer) => {
      acc[submitAnswer.blockId] = {
        isCorrect: submitAnswer.isCorrect,
        submit: submitAnswer.submit,
      };
      return acc;
    },
    {} as Record<string, { isCorrect: boolean; submit: BlockAnswerSubmit }>,
  );

  const [copied, copy] = useCopy();

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/workbooks/${session.workBook.id}/preview`;
    copy(url);
  }, [session.workBook.id]);

  return (
    <div className="w-full px-4">
      <div className="sticky top-0 z-10 backdrop-blur-sm flex items-center gap-2">
        <div className="ml-auto lg:hidden">
          <WorkBookLikeButton
            workBookId={session.workBook.id}
            initialIsLiked={session.isLiked}
            initialLikeCount={session.workBook.likeCount}
          />
        </div>
      </div>

      <div className="w-full lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,56rem)_minmax(0,1fr)] lg:gap-x-6">
        <div className="hidden lg:block" />
        <div className="mx-auto flex flex-col w-full max-w-4xl pb-24 lg:mx-0">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader>
              <div className="flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <h3 className="text-3xl font-bold text-foreground">
                    <GradualSpacingText text="문제 풀이 결과" />
                  </h3>
                  <p className="text-base text-muted-foreground fade-1000">
                    총{" "}
                    <span className="font-semibold text-primary">
                      {session.session.totalBlocks ||
                        session.workBook.blocks.length}
                    </span>{" "}
                    문제 중{" "}
                    <span className="font-semibold text-primary">
                      {session.session.correctBlocks || 0}
                    </span>{" "}
                    문제 정답입니다.
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
          <WorkbookHeader
            book={session.workBook}
            mode="review"
            className="mb-6 fade-1000"
          />
          {/* 문제들 */}
          <div className="space-y-6">
            {session.workBook.blocks.map((problem, index) => {
              // 해당 블록의 결과 찾기

              return (
                <Block
                  className={cn(
                    "fade-2000",
                    !submitAnswerByBlockId[problem.id]?.isCorrect
                      ? "bg-muted-foreground/5"
                      : "",
                  )}
                  index={index}
                  key={problem.id}
                  id={problem.id}
                  question={problem.question}
                  order={problem.order}
                  type={problem.type}
                  content={problem.content}
                  isCorrect={submitAnswerByBlockId[problem.id]?.isCorrect}
                  answer={problem.answer}
                  submit={submitAnswerByBlockId[problem.id]?.submit}
                  mode="review"
                />
              );
            })}
          </div>
        </div>
        <div className="hidden lg:flex lg:justify-center">
          <div className="sticky top-[20%] h-fit pt-1 flex flex-col gap-4">
            <WorkBookLikeButton
              workBookId={session.workBook.id}
              initialIsLiked={session.isLiked}
              initialLikeCount={session.workBook.likeCount}
            />
            <WorkbookCommentsPanel
              workBookId={session.workBook.id}
              workbookTitle={session.workBook.title}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="text-muted-foreground"
                  aria-label="댓글 보기"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <span className="text-2xs text-muted-foreground">
                  {commentCount}
                </span>
              </div>
            </WorkbookCommentsPanel>
            <div className="flex flex-col items-center justify-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="text-muted-foreground"
                onClick={handleShare}
              >
                {copied ? <CheckIcon /> : <Share2Icon />}
              </Button>
              <span className="text-2xs text-muted-foreground">
                {copied ? "링크 복사됨" : "공유"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
