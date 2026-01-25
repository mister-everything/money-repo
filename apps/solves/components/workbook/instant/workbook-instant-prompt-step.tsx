import {
  BlockType,
  blockDisplayNames,
  ChatModel,
} from "@service/solves/shared";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { Textarea } from "@/components/ui/textarea";
import { ModelDropDownMenu } from "../../chat/model-drop-down-menu";

export function WorkbookInstantPromptStep({
  model,
  prompt,
  onModelChange,
  onPromptChange,
  blockTypes,
  onBlockTypesChange,
  blockCount,
  onBlockCountChange,
  onNextStep,
  onPreviousStep,
}: {
  model?: ChatModel;
  onModelChange: (model: ChatModel) => void;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  blockTypes: BlockType[];
  onBlockTypesChange: (blockTypes: BlockType[]) => void;
  blockCount: number;
  onBlockCountChange: (blockCount: number) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>문제 유형과 개수를 골라주세요</span>
        </div>
        <p className="text-xs text-muted-foreground">
          여러 유형을 섞으면 더 게임처럼 진행돼요.
        </p>
        <ButtonSelect
          value={blockTypes}
          multiple={true}
          onChange={(value) => {
            onBlockTypesChange(value as BlockType[]);
          }}
          name="format"
          options={Object.entries(blockDisplayNames).map(([value, label]) => ({
            label,
            value,
          }))}
        />
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">
            풀고 싶은 문제 개수를 골라주세요
          </p>
          <ButtonSelect
            value={blockCount.toString()}
            onChange={(value) => {
              onBlockCountChange(Number(value));
            }}
            name="blockCount"
            options={[
              { label: "3", value: "3" },
              { label: "5", value: "5" },
              { label: "10", value: "10" },
            ]}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span> 자세하게 적을수록 더 정확한 계획을 만들 수 있어요.</span>
        </div>

        <div className="flex flex-col rounded-xl bg-background dark:bg-muted/30 hover:ring-1 ring-input transition-all duration-200 p-2 cursor-pointer">
          <Textarea
            value={prompt || ""}
            onChange={(e) => {
              onPromptChange(e.target.value);
            }}
            placeholder="예: React 상태관리 위주로, 실무에서 실수하기 쉬운 포인트 중심 문제를 5개 만들어주세요"
            className="min-h-20 resize-none max-h-48 border-none shadow-none bg-transparent! focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="w-full flex justify-end">
            <ModelDropDownMenu
              defaultModel={model}
              onModelChange={onModelChange}
              align="end"
              side="top"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-4">
        <Button
          onClick={onPreviousStep}
          variant={"secondary"}
          size={"lg"}
          className="flex-1 shadow-none bg-input"
        >
          이전
        </Button>

        <Button
          onClick={onNextStep}
          disabled={!prompt || !model || !blockTypes.length || !blockCount}
          size={"lg"}
          className="flex-1"
        >
          다음
        </Button>
      </div>
    </div>
  );
}
