"use client";

import { useState } from "react";
import { toast } from "sonner";

export const useCopy = (timeout = 2000) => {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("클립보드에 복사되었습니다.");
    setTimeout(() => {
      setCopied(false);
    }, timeout);
  };

  return { copied, copy };
};
