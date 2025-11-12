import { planService } from "@service/solves";
import Link from "next/link";
import { PlanCard } from "@/components/pricing/plan-card";

export default async function PricingPage() {
  const plans = await planService.getAllPlans();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <Link key={plan.id} href={`/solves/pricing/${plan.id}`}>
          <PlanCard className="cursor-pointer" plan={plan} />
        </Link>
      ))}
    </div>
  );
}
