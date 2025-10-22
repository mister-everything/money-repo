import { planAdminService } from "@service/solves";
import Link from "next/link";

import { PlanCard } from "@/components/solves/plan-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PlanItemsPage() {
  const plans = await planAdminService.getAllPlans();

  return (
    <main className="flex flex-1 flex-col ">
      <div className="flex items-center p-2">
        <p className="text-muted-foreground">
          구독 플랜을 생성, 수정하고 관리할 수 있습니다.
        </p>

        <Link href="/solves/plan/create" className="ml-auto">
          <Button>새로운 플랜 생성</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </main>
  );
}
