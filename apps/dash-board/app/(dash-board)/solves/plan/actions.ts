"use server";

import { planService } from "@service/solves";
import {
  createSubscriptionPlanSchema,
  PlanContentBlock,
} from "@service/solves/shared";
import { z } from "zod";
import { safeAction } from "@/lib/protocol/server-action";

const planFormSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  plans: z
    .array(z.object({ type: z.literal("text"), text: z.string() }))
    .optional(),
  price: z.string(),
  monthlyQuota: z.string(),
  refillAmount: z.string(),
  refillIntervalHours: z.number(),
  maxRefillCount: z.number(),
  isActive: z.boolean(),
});

export type PlanFormData = z.infer<typeof planFormSchema>;

/**
 * 플랜 생성 액션
 */
export const createPlanAction = safeAction(planFormSchema, async (data) => {
  const validated = createSubscriptionPlanSchema.parse({
    ...data,
    plans: data.plans && data.plans.length > 0 ? data.plans : undefined,
  });
  await planService.createPlan(validated);
  return { success: true };
});

/**
 * 플랜 수정 액션
 */
export const updatePlanAction = safeAction(
  planFormSchema.extend({ id: z.string() }),
  async ({ id, ...data }) => {
    const validated = createSubscriptionPlanSchema.partial().parse({
      ...data,
      plans: data.plans && data.plans.length > 0 ? data.plans : undefined,
    });
    await planService.updatePlan(id, validated);
    return { id };
  },
);

/**
 * 플랜 활성화/비활성화 토글 액션
 */
export const togglePlanActiveAction = safeAction(
  z.object({
    planId: z.string(),
    isActive: z.boolean(),
  }),
  async ({ planId, isActive }) => {
    await planService.setPlanActive(planId, isActive);
    return { planId, isActive };
  },
);
