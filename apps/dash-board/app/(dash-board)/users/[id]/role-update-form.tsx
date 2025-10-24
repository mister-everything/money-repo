"use client";

import { errorToString } from "@workspace/util";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "./actions";

export function RoleUpdateForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === currentRole) {
      toast.info("역할이 변경되지 않았습니다.");
      return;
    }

    setLoading(true);
    try {
      await updateUserRole(userId, role);
      toast.success("역할이 성공적으로 변경되었습니다.");
    } catch (error) {
      toast.error(errorToString(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role">역할 선택</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="역할을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">사용자 (USER)</SelectItem>
            <SelectItem value="admin">관리자 (ADMIN)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading || role === currentRole}>
        {loading ? "변경 중..." : "역할 변경"}
      </Button>
    </form>
  );
}
