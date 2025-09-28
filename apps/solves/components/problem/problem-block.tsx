import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProbBlock } from "@/type";
import { ContentRenderer } from "./content-renderer";
import { ProblemOptions } from "./problem-options";

interface ProblemBlockProps {
  problem: ProbBlock;
  problemNumber: number;
  onAnswerChange?: (problemId: string, answer: string | string[]) => void;
}

export const ProblemBlock: React.FC<ProblemBlockProps> = ({
  problem,
  problemNumber,
  onAnswerChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="gap-3 mb-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold text-sm mb-4">
            문제 {problemNumber}
          </span>
        </div>
        <ContentRenderer content={problem.content} />

        {/* 태그들 */}
        {/* {problem.tags && problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {problem.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )} */}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 문제 내용 */}

        {/* 문제 옵션/답안 영역 */}
        <div>
          <ProblemOptions
            options={problem.options}
            answerMeta={problem.answerMeta}
            onAnswerChange={(answer) => onAnswerChange?.(problem.id, answer)}
            groupName={`problem-option-${problem.id}`}
          />
        </div>

        {/* 문제 스타일 표시 (개발용) */}
        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>스타일: {problem.style}</span>
            <span>유형: {problem.answerMeta.kind}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
