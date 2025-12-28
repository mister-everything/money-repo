"use client";

import { Policy } from "@service/auth/shared";
import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PolicyVersion } from "./policy-table";

interface PolicyDialogProps {
  policy: PolicyVersion;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PolicyDialog({
  policy,
  open,
  onOpenChange,
}: PolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl! max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{policy.title}</span>
            <Badge variant={policy.isRequired ? "default" : "secondary"}>
              {policy.isRequired ? "필수" : "선택"}
            </Badge>
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
            <span>
              타입:{" "}
              {Policy.find((p) => p.value === policy.type)?.label ||
                policy.type}
            </span>
            <span>버전: v{policy.version}</span>
            <span>시행일: {formatDate(policy.effectiveAt)}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md p-4 bg-muted/30">
          <Streamdown mode="static">{policy.content}</Streamdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}
