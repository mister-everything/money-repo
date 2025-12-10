"use client";
import { LoaderIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WorkbookSolveResumePopupProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isRestarting?: boolean;
  onRestart: () => void;
  onContinue: () => void;
};

export function WorkbookSolveResumePopup({
  open,
  onOpenChange,
  isRestarting,
  onRestart,
  onContinue,
}: WorkbookSolveResumePopupProps) {
  const [isOpen, setIsOpen] = useState(open ?? false);
  const _open = useMemo(() => open ?? isOpen, [open, isOpen]);
  const _onOpenChange = useMemo(
    () => onOpenChange ?? setIsOpen,
    [onOpenChange, setIsOpen],
  );
  return (
    <Dialog open={_open} onOpenChange={_onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>이전 풀이 이력이 있습니다</DialogTitle>
          <DialogDescription>
            이전에 풀던 문제집이 있습니다. 이어서 풀까요, 아니면 새로
            시작할까요?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onRestart} disabled={isRestarting}>
            {isRestarting && <LoaderIcon className="size-4 animate-spin" />}
            새로 풀기
          </Button>
          <Button onClick={onContinue} disabled={isRestarting}>
            이어서 풀기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
