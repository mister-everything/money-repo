"use client";
import {
  BlockAnswerSubmit,
  ProbBook,
  SubmitProbBookResponse,
} from "@service/solves/shared";
import confetti from "canvas-confetti";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetcher } from "@/lib/fetcher";
import { ProblemBlock } from "./problem-block";
import { ProblemBookSequential } from "./problem-book-sequential";
import { ProblemHeader } from "./problem-header";
import { SolveModeSelector } from "./solve-mode-selector";

interface ProblemBookProps {
  probBook: ProbBook;
}

const handleConfetti = () => {
  const end = Date.now() + 1 * 1000;
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];

  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });

    requestAnimationFrame(frame);
  };

  frame();
};

export const ProblemBook: React.FC<ProblemBookProps> = ({ probBook }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "all" | "sequential" | null;
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, BlockAnswerSubmit>>({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState<
    Record<string, BlockAnswerSubmit>
  >({});
  const [submitResult, setSubmitResult] = useState<SubmitProbBookResponse>();
  // 세션 초기화 (모드가 선택된 후에만)
  useEffect(() => {
    // 모드가 선택되지 않았으면 세션 초기화 안 함
    if (!mode) {
      return;
    }

    const initSession = async () => {
      try {
        const response = await fetcher<{
          success: boolean;
          data: {
            submitId: string;
            startTime: Date;
            savedAnswers: Record<string, BlockAnswerSubmit>;
          };
        }>(`/api/workbooks/${probBook.id}/session`, {
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
  }, [probBook.id, mode]);

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
        await fetcher(`/api/workbooks/${probBook.id}/save`, {
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

    // 10초마다 실행
    const interval = setInterval(saveAnswers, 10000);

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
    }>(`/api/workbooks/${probBook.id}/submit`, {
      method: "POST",
      body: JSON.stringify({
        submitId,
        answer: answers,
      }),
    })
      .then((response) => {
        if (response?.success) {
          setSubmitResult(response.data);
          handleConfetti();
        }
      })
      .catch((error) => {
        console.error("제출 실패:", error);
        alert("답안 제출 중 오류가 발생했습니다.");
      });
  };

  const handleModeSelect = (selectedMode: "all" | "sequential") => {
    router.replace(`/workbooks/${probBook.id}/solve?mode=${selectedMode}`);
  };

  // 모드가 선택되지 않았으면 모드 선택 화면 표시
  if (!mode) {
    return (
      <SolveModeSelector probBook={probBook} onModeSelect={handleModeSelect} />
    );
  }

  // 공통 헤더 및 결과 요약 UI
  const renderHeader = () => (
    <>
      {/* 결과 요약 섹션 */}
      {submitResult && (
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
                <p className="text-2xl font-bold text-foreground">
                  {submitResult.score} <span className="text-xl">점</span>
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
      <ProblemHeader probBook={probBook} />
    </>
  );

  // 한 문제씩 풀이 모드
  if (mode === "sequential") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {renderHeader()}
        <ProblemBookSequential
          probBook={probBook}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
          submitResult={submitResult}
        />
      </div>
    );
  }

  // 전체 풀이 모드 (기존 방식)
  return (
    <div className="max-w-4xl mx-auto p-6">
      {renderHeader()}

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
            className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground/90 hover:border-primary/90"
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
