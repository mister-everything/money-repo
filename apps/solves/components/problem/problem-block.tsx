import {
  BlockAnswer,
  BlockAnswerSubmit,
  WorkBookBlockWithoutAnswer,
} from "@service/solves/shared";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContentRenderer } from "./content-renderer";
import { ProblemOptions } from "./problem-options";

interface ProblemBlockProps {
  problem: WorkBookBlockWithoutAnswer;
  problemNumber: number;
  submittedAnswer?: BlockAnswerSubmit; // 제출된 답안
  onAnswerChange?: (problemId: string, answer: BlockAnswerSubmit) => void;
  blockResult?: {
    isCorrect: boolean; // 정답 여부
    correctAnswer: BlockAnswer; // 실제 정답
  };
}

export const ProblemBlock: React.FC<ProblemBlockProps> = ({
  problem,
  problemNumber,
  submittedAnswer,
  onAnswerChange,
  blockResult,
}) => {
  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 mb-4 py-1">
            {blockResult &&
              (blockResult.isCorrect ? (
                <Check className="h-8 w-8 text-primary" />
              ) : (
                <X className="h-8 w-8 text-destructive" />
              ))}
            <span className="rounded-md px-2 py-1 text-sm bg-secondary text-secondary-foreground font-semibold">
              문제 {problemNumber}
            </span>
          </div>
        </div>
        <ContentRenderer
          content={problem.content}
          question={problem.question}
        />

        {/* 태그들 */}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 문제 내용 */}

        {/* 문제 옵션/답안 영역 */}
        <div>
          <ProblemOptions
            content={problem.content}
            submitted={submittedAnswer}
            onAnswerChange={(answer) => onAnswerChange?.(problem.id, answer)}
            groupName={`problem-option-${problem.id}`}
            correctAnswer={blockResult?.correctAnswer}
            isCorrect={blockResult?.isCorrect}
          />
        </div>
      </CardContent>
    </Card>
  );
};
