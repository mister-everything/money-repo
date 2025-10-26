"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AIPriceDialog } from "@/components/solves/ai-price-dialog";
import { Button } from "@/components/ui/button";
import { createAIPriceAction } from "./actions";

export function AIPricesClient() {
  const router = useRouter();

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      router.refresh(); // Refresh server component data
    }
  };

  return (
    <AIPriceDialog
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
