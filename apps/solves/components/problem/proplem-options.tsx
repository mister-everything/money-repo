import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { AnswerMeta, ProbSelectType } from "@/type";

interface ProblemOptionsProps {
  options?: ProbSelectType[];
  answerMeta: AnswerMeta;
  onAnswerChange?: (answer: string | string[]) => void;
  groupName?: string;
}

export const ProblemOptions: React.FC<ProblemOptionsProps> = ({
  options,
  answerMeta,
  onAnswerChange,
  groupName,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState<string>("");

  const handleOptionSelect = (optionId: string) => {
    if (answerMeta.kind === "objective") {
      let newSelected: string[];

      if (answerMeta.multiple) {
        // 복수 선택
        newSelected = selectedOptions.includes(optionId)
          ? selectedOptions.filter((id) => id !== optionId)
          : [...selectedOptions, optionId];
      } else {
        // 단일 선택
        newSelected = [optionId];
      }

      setSelectedOptions(newSelected);
      onAnswerChange?.(
        answerMeta.multiple ? newSelected : newSelected[0] || "",
      );
    }
  };

  const handleTextChange = (value: string) => {
    // 글자 수 제한 체크
    if (answerMeta.kind === "subjective" && answerMeta.charLimit) {
      if (value.length > answerMeta.charLimit) {
        return;
      }
    }

    setTextAnswer(value);
    onAnswerChange?.(value);
  };

  if (answerMeta.kind === "objective" && options) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground mb-3">
          {answerMeta.multiple ? "복수 선택 가능" : "단일 선택"}
        </div>

        {options.map((option, index) => (
          <div
            key={option.id}
            className={`
              flex items-center p-3 rounded-lg border cursor-pointer transition-colors
              ${
                selectedOptions.includes(option.id)
                  ? "bg-primary/5 border-primary"
                  : "bg-card border-border hover:bg-accent"
              }
            `}
            onClick={() => handleOptionSelect(option.id)}
          >
            <input
              type={answerMeta.multiple ? "checkbox" : "radio"}
              name={groupName ?? "problem-option"}
              checked={selectedOptions.includes(option.id)}
              onChange={() => {}} // onClick으로 처리
              className="mr-3 accent-primary"
            />

            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground">{index + 1}.</span>

              {option.type === "text" && (
                <span className="text-foreground">{option.data.content}</span>
              )}

              {option.type === "image" && (
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{option.data.content}</span>
                  {option.data.url && (
                    <img
                      src={option.data.url}
                      alt={`선택지 ${index + 1}`}
                      width={64}
                      height={48}
                      className="object-cover rounded"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (answerMeta.kind === "subjective") {
    const maxLines = answerMeta.lines || 3;
    const placeholder = answerMeta.placeholder || "답을 입력하세요.";

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>주관식 답변</span>
          {answerMeta.charLimit && (
            <span>
              {textAnswer.length} / {answerMeta.charLimit}자
            </span>
          )}
        </div>

        <Textarea
          value={textAnswer}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={placeholder}
          rows={maxLines}
          className="resize-none"
        />

        {answerMeta.charLimit && textAnswer.length >= answerMeta.charLimit && (
          <p className="text-sm text-destructive">
            최대 {answerMeta.charLimit}자까지 입력 가능합니다.
          </p>
        )}
      </div>
    );
  }

  return null;
};
