"use client";

import { LoaderIcon, PlusIcon, SaveIcon } from "lucide-react";
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

interface WorkbookEditActionBarProps {
  isPending: boolean;
  onAddBlock: () => void;
  onSave: () => void;
  onPublish?: () => void;
}

export function WorkbookEditActionBar({
  isPending,
  onAddBlock,
  onSave,
  onPublish,
}: WorkbookEditActionBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <FloatingActionBar>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              onClick={onAddBlock}
              className="rounded-full"
            >
              <PlusIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>문제 추가</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              disabled={isPending}
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
        <FloatingActionBarDivider />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full"
              variant="ghost"
              onClick={onPublish}
            >
              문제집 생성
            </Button>
          </TooltipTrigger>
          <TooltipContent>문제집 생성하여 공유....</TooltipContent>
        </Tooltip>
      </FloatingActionBar>
    </div>
  );
}
