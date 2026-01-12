"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletChargeDialog } from "./wallet-charge-dialog";

export function WalletChargeButton({
  userId,
  currentBalance,
}: {
  userId: string;
  currentBalance?: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>크레딧 충전</Button>
      <WalletChargeDialog
        userId={userId}
        currentBalance={currentBalance}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
