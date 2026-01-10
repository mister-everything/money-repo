import { planService } from "@service/solves";
import Link from "next/link";
import { PlanCard } from "@/components/pricing/plan-card";

export default async function PricingPage() {
  const plans = await planService.getAllPlans();
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="space-y-6">
        <h1 className="text-center text-3xl font-semibold py-6">
          함께 성장하는 요금제
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/pricing/${plan.id}`}>
              <PlanCard className="cursor-pointer" plan={plan} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
