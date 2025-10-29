import {
  BlockAnswer,
  BlockAnswerSubmit,
  ProbBlockWithoutAnswer,
} from "@service/solves/shared";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader as DialogPrimitiveHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AIInput } from "../ui/ai-input";
import { ContentRenderer } from "./content-renderer";
import { ProblemOptions } from "./problem-options";

interface ProblemBlockProps {
  problem: ProbBlockWithoutAnswer;
  problemNumber: number;
  submittedAnswer?: BlockAnswerSubmit;
  onAnswerChange?: (problemId: string, answer: BlockAnswerSubmit) => void;
  blockResult?: {
    isCorrect: boolean;
    correctAnswer: BlockAnswer;
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
    <Card className="bg-secondary">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 mb-4 py-1">
            {blockResult &&
              (blockResult.isCorrect ? (
                <Check className="h-8 w-8 text-primary" />
              ) : (
                <X className="h-8 w-8 text-destructive" />
              ))}
            <span className="rounded-full px-2 py-1 text-sm font-semibold bg-border">
              문제 {problemNumber}
            </span>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-1 rounded-full px-3 py-1 text-primary hover:bg-primary/10 sm:h-8"
              >
                <span className="ml-1 text-xs">?</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-md sm:w-full sm:max-w-2xl">
              <DialogPrimitiveHeader>
                <DialogTitle>문제 {problemNumber} 도움말</DialogTitle>
              </DialogPrimitiveHeader>
              <div className="space-y-4 text-sm">
                <div className="h-40 rounded-md bg-muted"></div>
              </div>
              <DialogFooter>
                <AIInput />
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
