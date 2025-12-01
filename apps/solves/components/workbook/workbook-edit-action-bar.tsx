"use client";

import { BlockType } from "@service/solves/shared";
import {
  ArrowUpDownIcon,
  ClipboardCheckIcon,
  LoaderIcon,
  PlusIcon,
  SaveIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FloatingActionBar,
  FloatingActionBarDivider,
} from "@/components/ui/floating-action-bar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_BLOCK_COUNT } from "@/lib/const";
import { BlockSelectPopup } from "./block/block-select-popup";

interface WorkbookEditActionBarProps {
  isPending: boolean;
  isReorderMode: boolean;
  isSolveMode: boolean;
  onAddBlock: (blockType: BlockType) => void;
  onSave: () => void;
  onPublish: () => void;
  onToggleReorderMode: () => void;
  onToggleSolveMode: () => void;
  isMaxBlockCount: boolean;
}

export function WorkbookEditActionBar({
  isPending,
  isReorderMode,
  isSolveMode,
  onAddBlock,
  onSave,
  onPublish,
  onToggleReorderMode,
  onToggleSolveMode,
  isMaxBlockCount,
}: WorkbookEditActionBarProps) {
  const isActionDisabled = isReorderMode || isSolveMode || isPending;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <FloatingActionBar>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <BlockSelectPopup onSelected={onAddBlock}>
                <Button
                  size="icon"
                  variant={isReorderMode ? "ghost" : "secondary"}
                  className="rounded-full"
                  disabled={isActionDisabled || isMaxBlockCount}
                >
                  <PlusIcon className="size-4" />
                </Button>
              </BlockSelectPopup>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isMaxBlockCount
              ? `문제는 최대 ${MAX_BLOCK_COUNT}개까지 입니다.`
              : "문제 추가"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isReorderMode ? "secondary" : "ghost"}
              onClick={onToggleReorderMode}
              className="rounded-full"
              disabled={isActionDisabled && !isReorderMode}
            >
              <ArrowUpDownIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isReorderMode ? "순서 변경 완료" : "문제 순서 변경"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              disabled={isPending || isReorderMode}
              onClick={onSave}
              className="rounded-full"
            >
              {isPending ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>임시 저장</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isSolveMode ? "secondary" : "ghost"}
              onClick={onToggleSolveMode}
              className="rounded-full"
              disabled={isActionDisabled && !isSolveMode}
            >
              <ClipboardCheckIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSolveMode ? "문제 수정" : "최종 검토"}
          </TooltipContent>
        </Tooltip>
        <FloatingActionBarDivider />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full"
              variant="ghost"
              onClick={onPublish}
              disabled={isReorderMode}
            >
              문제집 배포
            </Button>
          </TooltipTrigger>
          <TooltipContent>문제집 배포하여 공유....</TooltipContent>
        </Tooltip>
      </FloatingActionBar>
    </div>
  );
}
