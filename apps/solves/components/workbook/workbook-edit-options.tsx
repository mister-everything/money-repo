"use client";

import { BlockType, blockDisplayNames } from "@service/solves/shared";

import { ButtonSelect } from "@/components/ui/button-select";
import { WorkBookSituation } from "@/lib/const";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface BasePopupProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

// 상황 변경 팝업
export function WorkbookOptionSituation({
  children,
  value,
  onChange,
  align,
  side,
}: BasePopupProps & {
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[320px]" align={align} side={side}>
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">상황</h4>
            <p className="text-muted-foreground text-xs">
              문제집이 사용될 상황을 선택하세요.
            </p>
          </div>
          <ButtonSelect
            value={value ?? ""}
            onChange={onChange as any}
            name="situation"
            options={WorkBookSituation.map((value) => ({
              label: value.label,
              value: value.value,
            }))}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 유형 변경 팝업
export function WorkbookOptionBlockTypes({
  children,
  value,
  onChange,
  align,
  side,
}: BasePopupProps & {
  value?: BlockType[];
  onChange?: (value: BlockType[]) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[340px]" align={align} side={side}>
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">유형</h4>
            <p className="text-muted-foreground text-xs">
              문제의 유형을 선택하세요. (복수 선택 가능)
            </p>
          </div>
          <ButtonSelect
            value={value ?? (Object.keys(blockDisplayNames) as BlockType[])}
            multiple={true}
            onChange={onChange as any}
            name="blockTypes"
            options={Object.entries(blockDisplayNames).map(
              ([value, label]) => ({
                label,
                value,
              }),
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
