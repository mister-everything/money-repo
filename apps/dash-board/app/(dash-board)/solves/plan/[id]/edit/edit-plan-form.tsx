"use client";

import type { SubscriptionPlanWithCount } from "@service/solves/shared";
import { useRouter } from "next/navigation";
import {
  togglePlanActiveAction,
  updatePlanAction,
} from "@/app/(dash-board)/solves/plan/actions";
import { PlanForm } from "@/components/solves/plan-form";

interface EditPlanFormProps {
  plan: SubscriptionPlanWithCount;
}

export function EditPlanForm({ plan }: EditPlanFormProps) {
  const router = useRouter();

  const handleToggleActive = async () => {
    await togglePlanActiveAction(plan.id, !plan.isActive);
    // 활성화 변경 후 리스트로 이동
    router.push("/solves/plan");
  };

  // planId를 바인딩한 action
  const boundUpdateAction = updatePlanAction.bind(null, plan.id);

  return (
    <PlanForm
      mode="edit"
      initialData={plan}
      action={boundUpdateAction}
      onDelete={handleToggleActive}
    />
  );
}
