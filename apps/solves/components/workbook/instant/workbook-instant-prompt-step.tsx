import { ChatModel } from "@service/solves/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelDropDownMenu } from "../../chat/model-drop-down-menu";

export function PromptStep({
  model,
  prompt,
  onModelChange,
  onPromptChange,
  onNextStep,
  onPreviousStep,
}: {
  model?: ChatModel;
  onModelChange: (model: ChatModel) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>마지막으로 원하는 스타일을 알려주세요</span>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">사용할 AI 모델</span>
        <ModelDropDownMenu
          defaultModel={model}
          onModelChange={onModelChange}
          align="end"
          side="top"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        자세하게 적을수록 더 정확한 계획을 만들 수 있어요.
      </p>
      <Textarea
        value={prompt || ""}
        onChange={(e) => {
          onPromptChange(e.target.value);
        }}
        placeholder="예: React 상태관리 위주로, 실무에서 실수하기 쉬운 포인트 중심 문제를 5개 만들어주세요"
        className="min-h-30 resize-none max-h-48"
      />

      <div className="flex items-center justify-between gap-2 pt-4">
        <Button onClick={onPreviousStep} variant={"ghost"}>
          이전
        </Button>

        <Button onClick={onNextStep} disabled={!prompt || !model}>
          다음
        </Button>
      </div>
    </div>
  );
}
