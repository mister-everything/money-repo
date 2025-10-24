"use client";

import { errorToString } from "@workspace/util";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unbanUser } from "./actions";

export function UnbanUserButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleUnban = async () => {
    setLoading(true);
    try {
      await unbanUser(userId);
      toast.success("사용자의 밴이 해제되었습니다.");
    } catch (error) {
      toast.error(errorToString(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUnban}
      disabled={loading}
      variant="outline"
      size="sm"
    >
      {loading ? "처리 중..." : "밴 해제"}
    </Button>
  );
}
