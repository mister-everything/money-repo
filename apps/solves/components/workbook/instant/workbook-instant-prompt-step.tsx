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
          <span>어떤 문제를 풀고 싶은지 자세히 알려주세요</span>
        </div>
        <p className="text-xs text-muted-foreground">
          위에서 고른 설정은 그대로 반영돼요. 검색하듯 목표·수준·집중 포인트만 적으면
          AI가 즉석에서 맞춤 문제를 만들어줘요.
        </p>

        <div className="flex flex-col rounded-xl bg-background dark:bg-muted/30 hover:ring-1 ring-input transition-all duration-200 p-2 cursor-pointer">
          <Textarea
            value={prompt || ""}
            onChange={(e) => {
              onPromptChange(e.target.value);
            }}
            placeholder={`예:
현재 토익 350점이고 목표는 700점이에요. 영어 수준은 중학교 정도라 기초부터 다시 하고 싶어요.
Part 5/6 위주로 ‘기초~중’ 난이도로, 자주 나오는 문법/어휘를 실전처럼 연습하게 만들어주세요.
해설은 정답/오답 이유를 아주 자세하게, 쉬운 말로 설명해 주세요.`}
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
