"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/protocol/fetcher";

type WalletChargeDialogProps = {
  userId: string;
  currentBalance?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ChargeResponse = {
  ledgerId: string;
  newBalance: number;
};

export function WalletChargeDialog({
  userId,
  currentBalance,
  open,
  onOpenChange,
}: WalletChargeDialogProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const formattedBalance = useMemo(() => {
    if (currentBalance == null) return "-";
    return `${currentBalance.toLocaleString("ko-KR")} Balance`;
  }, [currentBalance]);

  const handleConfirm = useCallback(async () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("충전 크레딧을 0보다 큰 숫자로 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        amount: parsedAmount,
        reason: reason.trim() ? reason.trim() : undefined,
      };

      await fetcher<ChargeResponse>(`/api/users/${userId}/wallet/charge`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(`충전 완료`);
      setOpen(false);
      setAmount("");
      setReason("");
      router.refresh();
    } catch (error: any) {
      toast.error(error ?? "충전에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [amount, reason, router, userId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (loading) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>지갑 충전</DialogTitle>
          <DialogDescription>현재 잔액: {formattedBalance}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="charge-amount">충전 크레딧</Label>
            <Input
              id="charge-amount"
              type="number"
              min="1"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="charge-reason">충전 사유 (선택)</Label>
            <Textarea
              id="charge-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="충전 사유를 입력하세요."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={loading}>
              취소
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "충전 중..." : "확인"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
