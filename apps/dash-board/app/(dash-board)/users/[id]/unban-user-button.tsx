"use client";

import { Button } from "@/components/ui/button";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { unbanUserAction } from "./actions";

export function UnbanUserButton({ userId }: { userId: string }) {
  const [, unbanUser, loading] = useSafeAction(unbanUserAction, {
    successMessage: "사용자의 밴이 해제되었습니다.",
    failMessage: "사용자의 밴이 해제에 실패했습니다.",
  });

  return (
    <Button
      onClick={() => unbanUser({ userId })}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? "처리 중..." : "밴 해제"}
    </Button>
  );
}
