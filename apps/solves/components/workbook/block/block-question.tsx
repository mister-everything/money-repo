import { MAX_QUESTION_LENGTH } from "@service/solves/shared";
import { CheckIcon, XIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "./types";

interface BlockQuestionProps {
  question: string;
  mode: WorkBookComponentMode;
  onChangeQuestion?: (question: string) => void;
  isSuggest?: boolean;
  onAcceptSuggest?: () => void;
  onRejectSuggest?: () => void;
}

export function BlockQuestion({
  question,
  mode,
  onChangeQuestion,
  isSuggest = false,
  onAcceptSuggest,
  onRejectSuggest,
}: BlockQuestionProps) {
  const isEditable = useMemo(() => mode == "edit", [mode]);

  const handleChangeQuestion = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeQuestion?.(e.target.value);
    },
    [onChangeQuestion],
  );

  const placeholder = useMemo(() => {
    return ["preview", "edit"].includes(mode)
      ? "문제의 질문을 작성하세요"
      : "질문이 비어있습니다.";
  }, [mode]);

  return (
    <div
      className={cn(
        "w-full py-2 overflow-x-auto",
        !question && "text-muted-foreground",
      )}
    >
      {isSuggest && (onAcceptSuggest || onRejectSuggest) && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground mr-auto">문제</span>
          {onRejectSuggest && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-destructive hover:text-destructive"
              onClick={onRejectSuggest}
            >
              <XIcon className="size-4" />
            </Button>
          )}
          {onAcceptSuggest && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs text-primary hover:text-primary hover:bg-primary/10"
              onClick={onAcceptSuggest}
            >
              <CheckIcon className="size-4" />
            </Button>
          )}
        </div>
      )}
      {isEditable ? (
        <Textarea
          className="min-h-[100px] max-h-[300px] resize-none shadow-none"
          value={question}
          placeholder={placeholder}
          maxLength={MAX_QUESTION_LENGTH}
          autoFocus
          onChange={handleChangeQuestion}
        />
      ) : (
        <div className="p-2">
          <Streamdown isAnimating shikiTheme={["github-light", "github-dark"]}>
            {question || placeholder}
          </Streamdown>
        </div>
      )}
    </div>
  );
}
