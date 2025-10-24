"use client";

import { errorToString } from "@workspace/util";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { banUser } from "./actions";

export function BanUserForm({ userId }: { userId: string }) {
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("밴 사유를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await banUser(userId, reason, expiresAt || undefined);
      toast.success("사용자가 성공적으로 밴되었습니다.");
      setReason("");
      setExpiresAt("");
    } catch (error) {
      toast.error(errorToString(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">밴 사유 *</Label>
        <Textarea
          id="reason"
          placeholder="밴 사유를 입력하세요..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">밴 만료일 (선택사항)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">비워두면 영구 밴됩니다.</p>
      </div>

      <Button type="submit" variant="destructive" disabled={loading}>
        {loading ? "처리 중..." : "사용자 밴"}
      </Button>
    </form>
  );
}
