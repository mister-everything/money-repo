"use client";

import {
  BlockAnswerSubmit,
  SubmitWorkBookResponse,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import { Card, CardHeader } from "@/components/ui/card";
import { ProblemBlock } from "../problem/problem-block";

interface WorkBookReviewProps {
  workBook: WorkBookWithoutAnswer;
  submitResult: SubmitWorkBookResponse;
  answers: Record<string, BlockAnswerSubmit>;
}

export const WorkBookReview: React.FC<WorkBookReviewProps> = ({
  workBook,
  submitResult,
  answers,
}) => {
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
                  {submitResult.totalProblems}
                </span>{" "}
                문제 중{" "}
                <span className="font-bold text-primary">
                  {submitResult.correctAnswerIds.length}
                </span>{" "}
                문제 정답입니다.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 문제들 */}
      <div className="space-y-6">
        {workBook.blocks.map((problem, index) => {
          // 해당 블록의 결과 찾기
          const blockResult = submitResult.blockResults.find(
            (result) => result.blockId === problem.id,
          );

          return (
            <ProblemBlock
              key={problem.id}
              problem={problem}
              problemNumber={index + 1}
              submittedAnswer={answers[problem.id]}
              blockResult={
                blockResult
                  ? {
                      isCorrect: submitResult.correctAnswerIds.includes(
                        problem.id,
                      ),
                      correctAnswer: blockResult.answer,
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
};
