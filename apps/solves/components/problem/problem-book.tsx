"use client";
import {
  BlockAnswerSubmit,
  ProbBook,
  SubmitProbBookResponse,
} from "@service/solves/shared";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetcher } from "@/lib/fetcher";
import { ProblemBlock } from "./problem-block";

interface ProblemBookProps {
  probBook: ProbBook;
}

export const ProblemBook: React.FC<ProblemBookProps> = ({ probBook }) => {
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, BlockAnswerSubmit>>({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState<
    Record<string, BlockAnswerSubmit>
  >({});
  const [submitResult, setSubmitResult] = useState<SubmitProbBookResponse>();
  // 세션 초기화 (페이지 로드 시)
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetcher<{
          success: boolean;
          data: {
            submitId: string;
            startTime: Date;
            savedAnswers: Record<string, BlockAnswerSubmit>;
          };
        }>(`/api/prob/${probBook.id}/session`, {
          method: "GET",
        });

        if (response?.success && response.data) {
          setSubmitId(response.data.submitId);
          setAnswers(response.data.savedAnswers || {});
          setLastSavedAnswers(response.data.savedAnswers || {});
        }
      } catch (error) {
        console.error("세션 초기화 실패:", error);
      }
    };

    initSession();
  }, [probBook.id]);

  // 30초 주기 자동 저장
  useEffect(() => {
    if (!submitId) {
      return;
    }

    const saveAnswers = async () => {
      const hasChanges =
        JSON.stringify(answers) !== JSON.stringify(lastSavedAnswers);

      if (!hasChanges) {
        return;
      }

      try {
        await fetcher(`/api/prob/${probBook.id}/save`, {
          method: "POST",
          body: JSON.stringify({
            submitId,
            answers,
          }),
        });

        setLastSavedAnswers(answers);
      } catch (error) {
        console.error("답안 자동 저장 실패:", error);
      }
    };

    // 30초마다 실행
    const interval = setInterval(saveAnswers, 30000);

    return () => clearInterval(interval);
  }, [answers, lastSavedAnswers, submitId, probBook.id]);

  const handleAnswerChange = useCallback(
    (problemId: string, answer: BlockAnswerSubmit) => {
      setAnswers((prev) => ({
        ...prev,
        [problemId]: answer,
      }));
    },
    [],
  );

  const handleSubmit = async () => {
    if (!submitId) {
      alert("세션이 준비되지 않았습니다.");
      return;
    }

    await fetcher<{
      success: boolean;
      data: SubmitProbBookResponse;
    }>(`/api/prob/${probBook.id}/submit`, {
      method: "POST",
      body: JSON.stringify({
        submitId,
        answer: answers,
      }),
    })
      .then((response) => {
        if (response?.success) {
          setSubmitResult(response.data);
        }
      })
      .catch((error) => {
        console.error("제출 실패:", error);
        alert("답안 제출 중 오류가 발생했습니다.");
      });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 문제집 헤더 */}
      <Card className="mb-8 text-primary border-none">
        <CardHeader>
          {/* 결과 요약 섹션 */}
          {submitResult && (
            // 가운데 정렬
            <div className="flex items-center justify-center mb-6 pb-6 border-b border-border">
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
                <p className="text-2xl font-bold text-foreground">
                  {submitResult.score} <span className="text-xl">점</span>
                </p>
              </div>
            </div>
          )}

          <CardTitle className="text-3xl text-foreground">
            {probBook.title}
          </CardTitle>
          {probBook.description && (
            <CardDescription className="text-foreground">
              {probBook.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 text-sm text-foreground">
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
        {probBook.blocks.map((problem, index) => {
          // 해당 블록의 결과 찾기
          const blockResult = submitResult?.blockResults.find(
            (result) => result.blockId === problem.id,
          );

          return (
            <ProblemBlock
              key={problem.id}
              problem={problem}
              problemNumber={index + 1}
              submittedAnswer={answers[problem.id]}
              onAnswerChange={handleAnswerChange}
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

      {/* 제출 버튼 */}
      {!submitResult && (
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
      )}

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
