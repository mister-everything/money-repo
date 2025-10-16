import { planAdminService } from "@service/solves";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PlanCard } from "@/components/solves/plan-card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PlanItemsPage() {
  const plans = await planAdminService.getAllPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ">구독 플랜 관리</h1>
          <p className="text-muted-foreground mt-1">
            구독 플랜을 생성, 수정하고 관리할 수 있습니다.
          </p>
        </div>
        <Link href={"/solves/plan/create"}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />새 플랜 생성
          </Button>
        </Link>
      </div>

      {/* 플랜 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
