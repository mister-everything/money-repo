"use client";

import type { SubscriptionPlanWithCount } from "@service/solves/shared";
import { useRouter } from "next/navigation";
import {
  togglePlanActiveAction,
  updatePlanAction,
} from "@/app/(dash-board)/solves/plan/actions";
import { PlanForm } from "@/components/solves/plan-form";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

interface EditPlanFormProps {
  plan: SubscriptionPlanWithCount;
}

export function EditPlanForm({ plan }: EditPlanFormProps) {
  const router = useRouter();

  const [, toggleActive] = useSafeAction(togglePlanActiveAction, {
    onSuccess: () => {
      router.push("/solves/plan");
    },
  });

  const handleToggleActive = async (isActive: boolean) => {
    toggleActive({ planId: plan.id, isActive });
  };

  return (
    <PlanForm
      mode="edit"
      initialData={plan}
      action={updatePlanAction}
      onToggleActive={handleToggleActive}
    />
  );
}
