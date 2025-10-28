"use client";

import type { ProbBlockWithoutAnswer } from "@service/solves/shared";
import { ProblemCard } from "./problem-card";

interface ProblemSetDisplayProps {
  problems: ProbBlockWithoutAnswer[];
  onEdit?: (problemId: string) => void;
  onDelete?: (problemId: string) => void;
  onView?: (problemId: string) => void;
}

export function ProblemSetDisplay({
  problems,
  onEdit,
  onDelete,
  onView,
}: ProblemSetDisplayProps) {
  return (
    <div className="space-y-4">
      {problems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          아직 생성된 문제가 없습니다.
        </div>
      ) : (
        problems.map((problem, index) => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ))
      )}
    </div>
  );
}
