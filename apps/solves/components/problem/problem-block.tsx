import {
  BlockAnswerSubmit,
  ProbBlockWithoutAnswer,
} from "@service/solves/shared";
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
}

export const ProblemBlock: React.FC<ProblemBlockProps> = ({
  problem,
  problemNumber,
  submittedAnswer,
  onAnswerChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex items-start justify-between gap-3">
          <span className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            문제 {problemNumber}
          </span>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-1 rounded-full px-3 py-1 text-primary hover:bg-primary/10 sm:h-8"
              >
                <span className="sr-only">
                  문제 {problemNumber} 도움말 보기
                </span>
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
          />
        </div>

        {/* 문제 스타일 표시 (개발용) */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            {/* <span>스타일: {problem.style}</span> */}
            {/* <span>유형: {problem.answerMeta.kind}</span> */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
