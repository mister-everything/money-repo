"use client";

import { MAX_TAG_COUNT } from "@service/solves/shared";
import { XIcon } from "lucide-react";
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToRef } from "@/hooks/use-to-ref";
import { cn } from "@/lib/utils";

type WorkbookPublishPopupProps = {
  onPublish?: (tags: string[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isPending?: boolean;
};

const MAX_TAG_LENGTH = 20;

export function WorkbookPublishPopup({
  onPublish,
  open,
  onOpenChange,
  isPending = false,
  children,
}: PropsWithChildren<WorkbookPublishPopupProps>) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const _open = useMemo(() => open ?? isOpen, [open, isOpen]);
  const _onOpenChange = useMemo(
    () => onOpenChange ?? setIsOpen,
    [onOpenChange, setIsOpen],
  );

  const latest = useToRef({
    onOpenChange: _onOpenChange,
    tags,
    onPublish,
  });

  const handleAddTag = useCallback(() => {
    const trimmed = inputValue.trim().slice(0, MAX_TAG_LENGTH);
    if (!trimmed) return;
    if (tags.length >= MAX_TAG_COUNT) return;
    if (tags.includes(trimmed)) {
      setInputValue("");
      return;
    }
    setTags((prev) => [...prev, trimmed]);
    setInputValue("");
  }, [inputValue, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === "Enter" &&
        e.currentTarget.value.trim() &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault();
        handleAddTag();
      }
      if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [handleAddTag, inputValue, tags.length],
  );

  const handlePublish = useCallback(() => {
    latest.current.onPublish?.(latest.current.tags);
  }, []);

  useEffect(() => {
    if (!_open) {
      setTags([]);
      setInputValue("");
    }
  }, [_open]);

  return (
    <Dialog open={_open} onOpenChange={_onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>문제집 발행</DialogTitle>
          <DialogDescription>
            태그를 추가하면 다른 사용자가 문제집을 쉽게 찾을 수 있어요 문제집
            수정 불가!!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              태그 ({tags.length}/{MAX_TAG_COUNT})
            </label>
            <div
              className={cn(
                "flex flex-wrap items-center gap-2 p-2 rounded-md border min-h-[42px]",
                "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
              )}
            >
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1 animate-in fade-in-0 zoom-in-95"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 rounded-full hover:bg-foreground/10 p-0.5 transition-colors"
                  >
                    <XIcon className="size-3" />
                    <span className="sr-only">태그 삭제</span>
                  </button>
                </Badge>
              ))}
              {tags.length < MAX_TAG_COUNT && (
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={tags.length === 0 ? "태그 입력 후 Enter" : ""}
                  maxLength={MAX_TAG_LENGTH}
                  className="flex-1 min-w-[120px] border-0 p-0 h-7 shadow-none focus-visible:ring-0"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Enter로 태그 추가, 최대 {MAX_TAG_COUNT}개
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              취소
            </Button>
          </DialogClose>
          <Button onClick={handlePublish} disabled={isPending}>
            {isPending ? "발행 중..." : "발행하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
