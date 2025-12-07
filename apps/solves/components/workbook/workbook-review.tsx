"use client";

import {
  BlockAnswerSubmit,
  WorkBookReviewSession,
} from "@service/solves/shared";
import { useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Block } from "./block/block";

interface WorkBookReviewProps {
  session: WorkBookReviewSession;
}

export const WorkBookReview: React.FC<WorkBookReviewProps> = ({ session }) => {
  const submitAnswerByBlockId = useMemo(() => {
    return session.submitAnswers.reduce(
      (acc, submitAnswer) => {
        acc[submitAnswer.blockId] = {
          isCorrect: submitAnswer.isCorrect,
          submit: submitAnswer.submit,
        };
        return acc;
      },
      {} as Record<string, { isCorrect: boolean; submit: BlockAnswerSubmit }>,
    );
  }, [session.submitAnswers]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 결과 요약 섹션 */}
      <Card className="mb-8 border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-center">
            <div className="space-y-2 text-center">
              <h3 className="text-3xl font-bold text-foreground">
                문제 풀이 결과
              </h3>
              <p className="text-base text-muted-foreground">
                총{" "}
                <span className="font-bold text-primary">
                  {session.session.totalBlocks ||
                    session.workBook.blocks.length}
                </span>{" "}
                문제 중{" "}
                <span className="font-bold text-primary">
                  {session.session.correctBlocks || 0}
                </span>{" "}
                문제 정답입니다.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
      {/* 문제들 */}
      <div className="space-y-6">
        {session.workBook.blocks.map((problem, index) => {
          // 해당 블록의 결과 찾기

          return (
            <Block
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
  );
};
