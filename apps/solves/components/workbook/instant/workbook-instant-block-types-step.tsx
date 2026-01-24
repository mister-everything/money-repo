import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";

export function BlockTypesStep({
  blockTypes,
  onBlockTypesChange,
  blockCount,
  onBlockCountChange,
  onNextStep,
  onPreviousStep,
}: {
  blockTypes: BlockType[];
  onBlockTypesChange: (blockTypes: BlockType[]) => void;
  blockCount: number;
  onBlockCountChange: (blockCount: number) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
}) {
  return (
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
      <div className="flex items-center justify-between gap-2 pt-4">
        <Button
          onClick={onPreviousStep}
          variant={"ghost"}
          disabled={!blockTypes.length || !blockCount}
        >
          이전
        </Button>

        <Button
          onClick={onNextStep}
          disabled={!blockTypes.length || !blockCount}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
