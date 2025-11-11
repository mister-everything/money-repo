"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AIPriceDialog } from "@/components/solves/ai-price-dialog";
import { Button } from "@/components/ui/button";
import { createAIPriceAction } from "./actions";

export function AIPricesClient() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const handleDialogChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      router.refresh(); // Refresh server component data
    }
  };

  return (
    <AIPriceDialog
      open={open}
      mode="create"
      onOpenChange={handleDialogChange}
      action={createAIPriceAction}
    >
      <Button>
        <Plus className="h-4 w-4 mr-2" />새 가격 추가
      </Button>
    </AIPriceDialog>
  );
}
