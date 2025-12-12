"use client";

import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { useCallback } from "react";
import { ButtonSelect } from "@/components/ui/button-select";
import {
  WorkBookAgeGroup,
  WorkBookDifficulty,
  WorkBookSituation,
} from "@/lib/const";
import { WorkbookOptions } from "@/store/types";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function WorkbookEditOptions({
  options,
  setOptions,
}: {
  options?: WorkbookOptions;
  setOptions?: (options: WorkbookOptions) => void;
}) {
  const setSituation = useCallback(
    (situation: string) => {
      setOptions?.({ ...options!, situation });
    },
    [options, setOptions],
  );

  const setBlockTypes = useCallback(
    (blockTypes: BlockType[]) => {
      setOptions?.({ ...options!, blockTypes });
    },
    [options, setOptions],
  );

  const setAgeGroup = useCallback(
    (ageGroup: string) => {
      setOptions?.({ ...options!, ageGroup });
    },
    [options, setOptions],
  );

  const setDifficulty = useCallback(
    (difficulty: string) => {
      setOptions?.({ ...options!, difficulty });
    },
    [options, setOptions],
  );

  return (
    <div className="flex flex-wrap gap-2 px-2 pb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <WorkbookOptionSituation
              value={options?.situation}
              onChange={setSituation}
            >
              <Button size={"sm"} variant={"outline"}>
                {WorkBookSituation.find(
                  (value) => value.value === options?.situation,
                )?.label || "상황"}
              </Button>
            </WorkbookOptionSituation>
          </div>
        </TooltipTrigger>
        <TooltipContent>상황</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <WorkbookOptionBlockTypes
              value={options?.blockTypes}
              onChange={setBlockTypes}
            >
              <Button size={"sm"} variant={"outline"}>
                {options?.blockTypes.length ==
                Object.keys(blockDisplayNames).length
                  ? "모든 유형"
                  : options?.blockTypes
                      .map((value) => blockDisplayNames[value])
                      .join(", ")}
              </Button>
            </WorkbookOptionBlockTypes>
          </div>
        </TooltipTrigger>
        <TooltipContent>문제 유형</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <WorkbookOptionAgeGroup
              value={options?.ageGroup}
              onChange={setAgeGroup}
            >
              <Button size={"sm"} variant={"outline"}>
                {WorkBookAgeGroup.find(
                  (value) => value.value === options?.ageGroup,
                )?.label || "연령대"}
              </Button>
            </WorkbookOptionAgeGroup>
          </div>
        </TooltipTrigger>
        <TooltipContent>연령대</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <WorkbookOptionDifficulty
              value={options?.difficulty}
              onChange={setDifficulty}
            >
              <Button size={"sm"} variant={"outline"}>
                {WorkBookDifficulty.find(
                  (value) => value.value === options?.difficulty,
                )?.label || "난이도"}
              </Button>
            </WorkbookOptionDifficulty>
          </div>
        </TooltipTrigger>
        <TooltipContent>난이도</TooltipContent>
      </Tooltip>
    </div>
  );
}

interface BasePopupProps {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

// 상황 변경 팝업
function WorkbookOptionSituation({
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
function WorkbookOptionBlockTypes({
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
      <PopoverContent className="w-[320px]" align={align} side={side}>
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

// 연령대 변경 팝업
function WorkbookOptionAgeGroup({
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
            <h4 className="text-sm font-bold text-foreground">연령대</h4>
            <p className="text-muted-foreground text-xs">
              대상 연령대를 선택하세요.
            </p>
          </div>
          <ButtonSelect
            value={value ?? "all"}
            onChange={onChange as any}
            name="ageGroup"
            options={WorkBookAgeGroup.map((value) => ({
              label: value.label,
              value: value.value,
            }))}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 난이도 변경 팝업
function WorkbookOptionDifficulty({
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
            <h4 className="text-sm font-bold text-foreground">난이도</h4>
            <p className="text-muted-foreground text-xs">
              문제의 난이도를 선택하세요.
            </p>
          </div>
          <ButtonSelect
            value={value ?? ""}
            onChange={onChange as any}
            name="difficulty"
            options={WorkBookDifficulty.map((value) => ({
              label: value.label,
              value: value.value,
            }))}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
