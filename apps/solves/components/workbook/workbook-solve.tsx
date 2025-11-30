"use client";

import {
  BlockAnswerSubmit,
  WorkBookWithoutAnswer,
} from "@service/solves/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemBlock } from "../problem/problem-block";
import { ProblemBookSequential } from "../problem/problem-book-sequential";
import { ProblemHeader } from "../problem/problem-header";
import { SolveModeSelector } from "../problem/solve-mode-selector";

interface WorkBookSolveProps {
  workBook: WorkBookWithoutAnswer;
  mode: "all" | "sequential" | null;
  answers: Record<string, BlockAnswerSubmit>;
  onAnswerChange: (problemId: string, answer: BlockAnswerSubmit) => void;
  onSubmit: () => void;
  onModeSelect: (selectedMode: "all" | "sequential") => void;
}

export const WorkBookSolve: React.FC<WorkBookSolveProps> = ({
  workBook,
  mode,
  answers,
  onAnswerChange,
  onSubmit,
  onModeSelect,
}) => {
  // 모드가 선택되지 않았으면 모드 선택 화면 표시
  if (!mode) {
    return (
      <SolveModeSelector workBook={workBook} onModeSelect={onModeSelect} />
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
          onAnswerChange={onAnswerChange}
          onSubmit={onSubmit}
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
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>

      {/* 제출 버튼 */}
      <div className="mt-8 text-center">
        <Button
          onClick={onSubmit}
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

