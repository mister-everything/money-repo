"use client";

import { PlanForm } from "@/components/solves/plan-form";
import { createPlanAction } from "../actions";

export default function CreatePlanPage() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-6">
        <div>
          <p className="text-muted-foreground">
            새로운 구독 플랜을 생성합니다.
          </p>
        </div>

        <PlanForm mode="create" action={createPlanAction} />
      </div>
    </main>
  );
}
