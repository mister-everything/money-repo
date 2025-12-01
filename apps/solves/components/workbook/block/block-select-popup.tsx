"use client";
import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { PropsWithChildren, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type BlockSelectPopupProps = {
  onSelected?: (block: BlockType) => void;
  defaultBlock?: BlockType;
  open?: boolean;
  onChangeOpen?: (open: boolean) => void;
};

export function BlockSelectPopup({
  onSelected,
  defaultBlock,
  open,
  onChangeOpen,
  children,
}: PropsWithChildren<BlockSelectPopupProps>) {
  const [block, setBlock] = useState<BlockType>(defaultBlock ?? "default");

  return (
    <Dialog open={open} onOpenChange={onChangeOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>생성할 문제 유형을 선택하세요</DialogTitle>
        <Separator className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {Object.entries(blockDisplayNames).map(([type, displayName]) => (
            <Button
              key={type}
              variant="outline"
              className={cn(
                "rounded-full",
                block == type && "border-primary bg-primary/5",
              )}
              onClick={() => setBlock(type as BlockType)}
            >
              {displayName}
            </Button>
          ))}
        </div>
        <div className="w-full flex justify-end mt-6">
          <DialogClose>
            <Button onClick={() => onSelected?.(block)}>
              문제집에 문제 넣기
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
