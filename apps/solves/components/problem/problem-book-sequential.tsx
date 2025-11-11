"use client";

import {
  BlockAnswerSubmit,
  ProbBook,
  SubmitProbBookResponse,
} from "@service/solves/shared";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProblemBlock } from "./problem-block";

interface ProblemBookSequentialProps {
  probBook: ProbBook;
  answers: Record<string, BlockAnswerSubmit>;
  onAnswerChange: (problemId: string, answer: BlockAnswerSubmit) => void;
  onSubmit: () => void;
  submitResult?: SubmitProbBookResponse;
}

export const ProblemBookSequential: React.FC<ProblemBookSequentialProps> = ({
  probBook,
  answers,
  onAnswerChange,
  onSubmit,
  submitResult,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 이전에 풀던 문제가 있으면 해당 인덱스로 이동
  useEffect(() => {
    if (submitResult) {
      // 결과가 있으면 첫 번째 문제로
      setCurrentIndex(0);
      return;
    }

    // 답안이 있는 가장 마지막 문제 다음으로 이동
    const answeredIndices = probBook.blocks
      .map((block, idx) => (answers[block.id] ? idx : -1))
      .filter((idx) => idx !== -1);

    if (answeredIndices.length > 0) {
      const lastAnsweredIndex = Math.max(...answeredIndices);
      const nextIndex = Math.min(
        lastAnsweredIndex + 1,
        probBook.blocks.length - 1,
      );
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex(0);
    }
  }, [probBook.blocks, submitResult]);

  // 답변 변경 핸들러 - 새로운 답변 선택 시에만 다음 문제로 이동
  const handleAnswerChange = (problemId: string, answer: BlockAnswerSubmit) => {
    // 기존 답변이 없었던 경우에만 자동 이동
    const hadAnswer = !!answers[problemId];

    // 답변 저장
    onAnswerChange(problemId, answer);
    // 객관식 ox인 경우에만 이동
    // 결과 화면이 아니고, 기존 답변이 없었고, 마지막 문제가 아니면 다음 문제로 이동
    if (
      !submitResult &&
      !hadAnswer &&
      (answer.type === "mcq" || answer.type === "ox")
    ) {
      handleNext();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < probBook.blocks.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentProblem = probBook.blocks[currentIndex];
  const progress = ((currentIndex + 1) / probBook.blocks.length) * 100;

  // 결과 화면이면 모든 문제를 순차적으로 표시
  if (submitResult) {
    return (
      <div className="space-y-6">
        {probBook.blocks.map((problem, index) => {
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
                blockResult && submitResult
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
    );
  }

  return (
    <>
      {/* 진행률 표시 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            문제 {currentIndex + 1} / {probBook.blocks.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 현재 문제 */}
      {currentProblem && (
        <div className="mb-6">
          <ProblemBlock
            problem={currentProblem}
            problemNumber={currentIndex + 1}
            submittedAnswer={answers[currentProblem.id]}
            onAnswerChange={handleAnswerChange}
          />
        </div>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          이전
        </Button>

        {currentIndex === probBook.blocks.length - 1 ? (
          <Button
            onClick={onSubmit}
            size="lg"
            variant="outline"
            className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground/90 hover:border-primary/90"
          >
            답안 제출
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={currentIndex === probBook.blocks.length - 1}
            variant="outline"
            className="flex items-center gap-2"
          >
            다음
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </>
  );
};
