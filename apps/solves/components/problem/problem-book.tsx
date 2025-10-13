"use client";

import { BlockAnswerSubmit, ProbBook } from "@service/solves/shared";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProblemBlock } from "./problem-block";

interface ProblemBookProps {
  probBook: ProbBook;
}

export const ProblemBook: React.FC<ProblemBookProps> = ({ probBook }) => {
  const [answers, setAnswers] = useState<Record<string, BlockAnswerSubmit>>({});

  const handleAnswerChange = useCallback(
    (problemId: string, answer: BlockAnswerSubmit) => {
      setAnswers((prev) => ({
        ...prev,
        [problemId]: answer,
      }));
    },
    [],
  );

  const handleSubmit = () => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("제출된 답안:", answers);
    }
    // 여기에 제출 로직 추가
    alert("답안이 제출되었습니다! (콘솔 확인)");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 문제집 헤더 */}
      <Card className="mb-8 text-primary border-none">
        <CardHeader>
          <CardTitle className="text-3xl">{probBook.title}</CardTitle>
          {probBook.description && (
            <CardDescription className="text-base">
              {probBook.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-primary">
              <span>총 {probBook.blocks.length}문제</span>
            </div>

            {probBook.tags && probBook.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {probBook.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm "
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 문제들 */}
      <div className="space-y-6">
        {probBook.blocks.map((problem, index) => (
          <ProblemBlock
            key={problem.id}
            problem={problem}
            problemNumber={index + 1}
            onAnswerChange={handleAnswerChange}
          />
        ))}
      </div>

      {/* 제출 버튼 */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit}
          size="lg"
          variant="outline"
          className="px-8 py-3 hover:bg-primary! hover:text-primary-foreground!"
        >
          답안 제출
        </Button>
      </div>

      {/* 답안 현황 (개발용) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">현재 답안 상황</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm text-muted-foreground overflow-auto bg-secondary p-4 rounded-md">
            {JSON.stringify(answers, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};
