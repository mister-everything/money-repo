import {
  type BlockAnswer,
  type BlockAnswerSubmit,
  type BlockContent,
  type BlockType,
  isAnswer,
  isContent,
  type McqBlockContent,
  type OxBlockContent,
} from "@service/solves/types";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface ProblemOptionsProps<T extends BlockType = BlockType> {
  content: BlockContent<T>;
  answer?: BlockAnswer<T>;
  submitted?: BlockAnswerSubmit<T>;
  onAnswerChange?: (answer: BlockAnswerSubmit<T>) => void;
  groupName?: string;
}

const getMcqOptionLabel = (
  option: McqBlockContent["options"][number],
): ReactNode => {
  if (option.type === "text") {
    return <span className="text-foreground">{option.text}</span>;
  }

  if (option.mimeType.startsWith("image/")) {
    return (
      <div className="flex items-center gap-3">
        <img
          src={option.url}
          alt="선택지 미리보기"
          width={80}
          height={60}
          className="h-20 w-20 rounded object-cover"
        />
        <span className="text-sm text-muted-foreground">{option.mimeType}</span>
      </div>
    );
  }

  return (
    <a
      href={option.url}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-primary underline"
    >
      {option.mimeType} 리소스 열기
    </a>
  );
};

const getOxLabel = (
  option: OxBlockContent["oOption"] | OxBlockContent["xOption"],
) => {
  if (option.type === "text") {
    return option.text;
  }

  if (option.mimeType.startsWith("image/")) {
    return (
      <img
        src={option.url}
        alt="OX 보기"
        width={96}
        height={72}
        className="h-24 w-24 rounded object-cover"
      />
    );
  }

  return option.url;
};

export const ProblemOptions = <T extends BlockType>({
  content,
  answer,
  submitted,
  onAnswerChange,
  groupName,
}: ProblemOptionsProps<T>) => {
  const isMcqContent = useMemo(() => isContent.mcq(content), [content]);
  const isOxContent = useMemo(() => isContent.ox(content), [content]);
  const isDefaultContent = useMemo(() => isContent.default(content), [content]);
  const isRankingContent = useMemo(() => isContent.ranking(content), [content]);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState("");
  const [oxAnswer, setOxAnswer] = useState<"o" | "x" | null>(null);

  // submitted prop 변경 시 로컬 state 초기화
  useEffect(() => {
    if (submitted?.type !== content.type) {
      setSelectedOptions([]);
      setOxAnswer(null);
      setTextAnswer("");
      return;
    }

    if (isMcqContent && isAnswer.mcq(submitted)) {
      setSelectedOptions(submitted.answer);
    } else {
      setSelectedOptions([]);
    }

    if (isOxContent && isAnswer.ox(submitted)) {
      const value = submitted.answer;
      setOxAnswer(value === "o" || value === "x" ? value : null);
    } else {
      setOxAnswer(null);
    }

    if (isDefaultContent && isAnswer.default(submitted)) {
      setTextAnswer(submitted.answer);
    }
  }, [content.type, isDefaultContent, isMcqContent, isOxContent, submitted]);

  if (isMcqContent && isContent.mcq(content)) {
    const allowMultiple = isAnswer.mcq(answer)
      ? answer.answer.length > 1
      : false;

    const handleOptionSelect = (optionId: string) => {
      if (allowMultiple) {
        const exists = selectedOptions.includes(optionId);
        if (exists && selectedOptions.length === 1) {
          return;
        }
        const updated = exists
          ? selectedOptions.filter((id) => id !== optionId)
          : [...selectedOptions, optionId];

        setSelectedOptions(updated);

        // 다음 이벤트 루프에서 부모에 알림
        if (updated.length > 0) {
          queueMicrotask(() => {
            onAnswerChange?.({
              type: content.type,
              answer: updated,
            } as BlockAnswerSubmit<T>);
          });
        }
      } else {
        const updated = [optionId];
        setSelectedOptions(updated);
        queueMicrotask(() => {
          onAnswerChange?.({
            type: content.type,
            answer: updated,
          } as BlockAnswerSubmit<T>);
        });
      }
    };

    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {allowMultiple ? "복수 선택 가능" : "한 개의 답을 선택하세요"}
        </div>

        {content.options.map((option, index) => {
          const checked = selectedOptions.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <input
                type={allowMultiple ? "checkbox" : "radio"}
                name={groupName ?? "problem-option"}
                checked={checked}
                onChange={() => handleOptionSelect(option.id)}
                className="accent-primary"
              />
              <div className="flex w-full items-center justify-between gap-4">
                <span className="text-sm font-semibold text-foreground">
                  {index + 1}.
                </span>
                <div className="flex-1 text-sm text-foreground">
                  {getMcqOptionLabel(option)}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    );
  }

  if (isOxContent && isContent.ox(content)) {
    const handleSelect = (value: "o" | "x") => {
      const nextValue = oxAnswer === value ? null : value;
      setOxAnswer(nextValue);

      if (nextValue !== null) {
        queueMicrotask(() => {
          onAnswerChange?.({
            type: content.type,
            answer: nextValue,
          } as BlockAnswerSubmit<T>);
        });
      }
    };

    return (
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: "o" as const, label: "O", option: content.oOption },
          { key: "x" as const, label: "X", option: content.xOption },
        ].map(({ key, label, option }) => {
          const checked = oxAnswer === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={`flex h-full w-full flex-col items-center gap-3 rounded-lg border p-5 text-center transition-colors ${
                checked
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <span className="text-xl font-bold text-foreground">{label}</span>
              <span className="text-sm text-muted-foreground">
                {getOxLabel(option)}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (isDefaultContent) {
    const handleChange = (value: string) => {
      setTextAnswer(value);

      if (value.length > 0) {
        queueMicrotask(() => {
          onAnswerChange?.({
            type: content.type,
            answer: value,
          } as BlockAnswerSubmit<T>);
        });
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>답안을 작성하세요</span>
          <span>{textAnswer.length}자</span>
        </div>
        <Textarea
          value={textAnswer}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="답을 입력하세요."
          rows={4}
          className="resize-none"
        />
      </div>
    );
  }

  if (isRankingContent && isContent.ranking(content)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          드래그 앤 드롭 정렬 기능은 준비 중입니다. 아래 항목들의 순서를 메모해
          두세요.
        </p>
        <ol className="space-y-2">
          {content.items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm text-foreground"
            >
              <span className="font-semibold text-muted-foreground">
                {index + 1}.
              </span>
              <span>{item.type === "text" ? item.text : item.url}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
      아직 지원되지 않는 문제 유형입니다.
    </div>
  );
};
