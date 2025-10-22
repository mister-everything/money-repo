"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AIPriceDialog } from "@/components/solves/ai-price-dialog";
import { Button } from "@/components/ui/button";
import { createAIPriceAction } from "./actions";

export function AIPricesClient() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();

  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      router.refresh(); // Refresh server component data
    }
  };

  return (
    <>
      <Button onClick={() => setIsCreateDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />새 가격 추가
      </Button>

      <AIPriceDialog
        mode="create"
        open={isCreateDialogOpen}
        onOpenChange={handleDialogChange}
        action={createAIPriceAction}
      />
    </>
  );
}
