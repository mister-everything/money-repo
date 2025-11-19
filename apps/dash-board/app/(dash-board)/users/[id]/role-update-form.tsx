"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { updateUserRoleAction } from "./actions";

export function RoleUpdateForm({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [role, setRole] = useState(currentRole);

  const [, updateUserRole, loading] = useSafeAction(updateUserRoleAction, {
    failMessage: "역할 변경에 실패했습니다.",
    successMessage: "역할이 성공적으로 변경되었습니다.",
  });

  return (
    <form className="space-y-4">
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

      <Button
        onClick={() => updateUserRole({ userId, role })}
        disabled={loading || role === currentRole}
      >
        {loading ? "변경 중..." : "역할 변경"}
      </Button>
    </form>
  );
}
