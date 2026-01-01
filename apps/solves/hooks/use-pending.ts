"use client";

import { generateUUID } from "@workspace/util";
import { useCallback, useState } from "react";

export const usePending = () => {
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const startPending = useCallback(() => {
    const id = generateUUID();
    setPendingIds((prev) => [...prev, id]);

    return () => {
      setPendingIds((prev) => prev.filter((v) => v !== id));
    };
  }, []);

  return [pendingIds.length > 0, startPending] as const;
};
