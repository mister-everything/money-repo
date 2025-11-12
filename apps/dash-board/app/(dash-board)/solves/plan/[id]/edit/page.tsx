import { planService } from "@service/solves";
import { notFound } from "next/navigation";

import { EditPlanForm } from "./edit-plan-form";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlanPage({ params }: EditPlanPageProps) {
  const { id } = await params;
  const plan = await planService.getPlanById(id);

  if (!plan) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <div>
          <p className="text-muted-foreground">
            {plan.displayName} 플랜을 수정합니다.
          </p>
        </div>

        <EditPlanForm plan={plan} />
      </div>
    </main>
  );
}
