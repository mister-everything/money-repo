import { MAX_QUESTION_LENGTH } from "@service/solves/shared";
import { useCallback, useMemo } from "react";
import { Streamdown } from "streamdown";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WorkBookComponentMode } from "./types";

interface BlockQuestionProps {
  question: string;
  mode: WorkBookComponentMode;
  onChangeQuestion?: (question: string) => void;
}

export function BlockQuestion({
  question,
  mode,
  onChangeQuestion,
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
    <div className={cn("w-full py-2", !question && "text-muted-foreground")}>
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
          <Streamdown>{question || placeholder}</Streamdown>
        </div>
      )}
    </div>
  );
}
