"use client";

import {
  BlockAnswerSubmit,
  SubmitWorkBookResponse,
  WorkBookSubmitSession,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import confetti from "canvas-confetti";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { fetcher } from "@/lib/protocol/fetcher";
import { ProblemBlock } from "../problem/problem-block";
import { ProblemBookSequential } from "../problem/problem-book-sequential";
import { ProblemHeader } from "../problem/problem-header";
import { SolveModeSelector } from "../problem/solve-mode-selector";
import { WorkBookReview } from "./workbook-review";

interface WorkBookSolveProps {
  workBook: WorkBookWithoutAnswer;
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

export const WorkBookSolve: React.FC<WorkBookSolveProps> = ({ workBook }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") as "all" | "sequential" | null;
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, BlockAnswerSubmit>>({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState<
    Record<string, BlockAnswerSubmit>
  >({});
  const [submitResult, setSubmitResult] = useState<SubmitWorkBookResponse>();

  // 세션 초기화 (모드가 선택된 후에만)
  useEffect(() => {
    // 모드가 선택되지 않았으면 세션 초기화 안 함
    if (!mode) {
      return;
    }

    const initSession = async () => {
      try {
        const response = await fetcher<WorkBookSubmitSession>(
          `/api/workbooks/${workBook.id}/session`,
          {
            method: "GET",
          },
        );
        console.log(response);
        if (response) {
          logger.info("세션 초기화 성공:", response);
          setSubmitId(response.submitId);
          setAnswers(response.savedAnswers || {});
          setLastSavedAnswers(response.savedAnswers || {});
        }
      } catch (error) {
        logger.error("세션 초기화 실패:", error);
      }
    };

    initSession();
  }, [workBook.id, mode]);

  // 5초 주기 자동 저장
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
        await fetcher(`/api/workbooks/${workBook.id}/save`, {
          method: "POST",
          body: JSON.stringify({
            submitId,
            answers,
          }),
        });

        setLastSavedAnswers(answers);
      } catch (error) {
        logger.error("답안 자동 저장 실패:", error);
      }
    };

    // 5초마다 실행
    const interval = setInterval(saveAnswers, 5000);

    return () => clearInterval(interval);
  }, [answers, lastSavedAnswers, submitId, workBook.id]);

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

    await fetcher<SubmitWorkBookResponse>(
      `/api/workbooks/${workBook.id}/submit`,
      {
        method: "POST",
        body: JSON.stringify({
          submitId,
          answer: answers,
        }),
      },
    )
      .then((response) => {
        if (response) {
          setSubmitResult(response);
          handleConfetti();
        }
      })
      .catch((error) => {
        logger.error("제출 실패:", error);
        alert("답안 제출 중 오류가 발생했습니다.");
      });
  };

  const handleModeSelect = (selectedMode: "all" | "sequential") => {
    router.replace(`/workbooks/${workBook.id}/solve?mode=${selectedMode}`);
  };

  // 결과 화면이 있으면 결과 화면 표시
  if (submitResult) {
    return (
      <WorkBookReview
        workBook={workBook}
        submitResult={submitResult}
        answers={answers}
      />
    );
  }

  // 모드가 선택되지 않았으면 모드 선택 화면 표시
  if (!mode) {
    return (
      <SolveModeSelector workBook={workBook} onModeSelect={handleModeSelect} />
    );
  }

  // 한 문제씩 풀이 모드
  if (mode === "sequential") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ProblemHeader workBook={workBook} />
        <ProblemBookSequential
          workBook={workBook}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
        />
      </div>
    );
  }

  // 전체 풀이 모드
  return (
    <div className="max-w-4xl mx-auto p-6">
      <ProblemHeader workBook={workBook} />

      {/* 문제들 */}
      <div className="space-y-6">
        {workBook.blocks.map((problem, index) => (
          <ProblemBlock
            key={problem.id}
            problem={problem}
            problemNumber={index + 1}
            submittedAnswer={answers[problem.id]}
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
          className="px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground/90 hover:border-primary/90"
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
