"use client";
import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToRef } from "@/hooks/use-to-ref";
import { cn } from "@/lib/utils";

type BlockSelectPopupProps = {
  onSelected?: (block: BlockType) => void;
  defaultBlock?: BlockType;
  open?: boolean;
  onChangeOpen?: (open: boolean) => void;
};

const blockItems = Object.entries(blockDisplayNames).map(
  ([type, displayName]) => ({ type, displayName }),
);

export function BlockSelectPopup({
  onSelected,
  defaultBlock,
  open,
  onChangeOpen,
  children,
}: PropsWithChildren<BlockSelectPopupProps>) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [block, setBlock] = useState<BlockType>(defaultBlock ?? "default");

  const _open = useMemo(() => open ?? isOpen, [open, isOpen]);
  const _onChangeOpen = useMemo(
    () => onChangeOpen ?? setIsOpen,
    [onChangeOpen, setIsOpen],
  );

  const latest = useToRef({
    onChangeOpen: _onChangeOpen,
    block,
    onSelected,
  });

  useEffect(() => {
    if (!_open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        latest.current.onSelected?.(latest.current.block);
        latest.current.onChangeOpen(false);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const index = blockItems.findIndex(
        ({ type }) => type == latest.current.block,
      );
      const isNext = e.key == "ArrowRight" || e.key == "ArrowDown";
      const isPrev = e.key == "ArrowLeft" || e.key == "ArrowUp";
      if (isNext || isPrev) {
        if (index === -1) return;
        const weight = isNext ? 1 : -1;
        const newIndex =
          (index + weight + blockItems.length) % blockItems.length;
        setBlock(blockItems[newIndex].type as BlockType);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [_open]);

  useEffect(() => {
    if (!_open) {
      setBlock(defaultBlock ?? "default");
    }
  }, [_open, defaultBlock]);

  return (
    <Dialog open={_open} onOpenChange={_onChangeOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>생성할 문제 유형을 선택하세요</DialogTitle>
        <Separator className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {blockItems.map(({ type, displayName }) => (
            <Button
              key={type}
              variant="outline"
              className={cn(
                "rounded-full focus-visible:ring-0!",
                block == type && "border-primary bg-primary/5",
              )}
              onClick={() => setBlock(type as BlockType)}
            >
              {displayName}
            </Button>
          ))}
        </div>
        <div className="w-full flex justify-end mt-6">
          <DialogClose asChild>
            <Button onClick={() => onSelected?.(block)}>
              문제집에 문제 넣기
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
