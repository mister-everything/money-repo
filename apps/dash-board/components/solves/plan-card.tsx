"use client";

import type { SubscriptionPlanWithCount } from "@service/solves/shared";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: SubscriptionPlanWithCount;
}

export function PlanCard({ plan }: PlanCardProps) {
  const price = parseFloat(plan.price);
  const monthlyQuota = parseFloat(plan.monthlyQuota);
  const refillAmount = parseFloat(plan.refillAmount);

  const features = useMemo<string[]>(() => {
    const defaultItems: string[] = [];
    defaultItems.push(`월간 할당량: ${monthlyQuota.toLocaleString()} 크레딧`);
    defaultItems.push(
      `자동 충전: ${refillAmount.toLocaleString()} 크레딧 / ${plan.refillIntervalHours}시간마다`,
    );
    defaultItems.push(`최대 충전: ${plan.maxRefillCount}회`);

    return [...defaultItems, ...(plan.plans?.map((block) => block.text) ?? [])];
  }, [
    monthlyQuota,
    refillAmount,
    plan.refillIntervalHours,
    plan.maxRefillCount,
    plan.plans,
  ]);

  return (
    <Card
      className={cn("shadow-none relative transition-all duration-200 group", {
        "opacity-40 hover:opacity-100": !plan.isActive,
        "hover:bg-primary/5 hover:border-primary": plan.isActive,
      })}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{plan.displayName}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <span>구독자 {plan.count}명</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-full flex flex-col gap-4">
        {/* 가격 정보 */}
        <div className="flex items-end gap-2 mb-4">
          <div className="text-3xl font-bold ">
            {price === 0 ? "무료" : `₩${price.toLocaleString()}`}
          </div>
          {price > 0 && (
            <div className="text-sm text-muted-foreground">/월</div>
          )}
        </div>

        {/* 플랜 상세 정보 */}
        <div className="space-y-2">
          {features.map((feature) => (
            <div
              key={feature}
              className="text-sm text-muted-foreground flex items-center gap-2.5"
            >
              <CheckIcon className="size-3" />
              {feature}
            </div>
          ))}
        </div>

        <Link href={`/solves/plan/${plan.id}/edit`} className="mt-auto">
          <Button className="w-full">수정</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
