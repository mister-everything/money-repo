import { useCallback, useMemo } from "react";
import { Streamdown } from "streamdown";
import { Textarea } from "@/components/ui/textarea";

import { BlockComponentMode } from "./types";

interface BlockQuestionProps {
  question: string;
  mode: BlockComponentMode;
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

  return (
    <div className="w-full py-2">
      {isEditable ? (
        <Textarea
          className="min-h-[100px] max-h-[300px] resize-none"
          value={question}
          placeholder="문제의 질문을 작성하세요"
          maxLength={300}
          autoFocus
          onChange={handleChangeQuestion}
        />
      ) : (
        <Streamdown>{question}</Streamdown>
      )}
    </div>
  );
}
