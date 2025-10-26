import { and, count, eq, getTableColumns } from "drizzle-orm";
import { pgDb } from "../db";
import { SubscriptionPlansTable, SubscriptionsTable } from "./schema";
import {
  type CreateSubscriptionPlan,
  createSubscriptionPlanSchema,
  type SubscriptionPlanWithCount,
  type UpdateSubscriptionPlan,
  updateSubscriptionPlanSchema,
} from "./types";

/**
 * Plan Admin Service
 *
 */
export const planAdminService = {
  getAllPlans: async (): Promise<SubscriptionPlanWithCount[]> => {
    const plans = await pgDb
      .select({
        ...getTableColumns(SubscriptionPlansTable),
        count: count(SubscriptionsTable.id).as("count"),
      })
      .from(SubscriptionPlansTable)
      .leftJoin(
        SubscriptionsTable,
        and(
          and(
            eq(SubscriptionPlansTable.id, SubscriptionsTable.planId),
            eq(SubscriptionsTable.status, "active"),
          ),
        ),
      )
      .groupBy(SubscriptionPlansTable.id)
      .orderBy(SubscriptionPlansTable.price);

    return plans;
  },

  /**
   * 플랜 ID로 단일 플랜 조회
   */
  getPlanById: async (
    planId: string,
  ): Promise<SubscriptionPlanWithCount | null> => {
    const [plan] = await pgDb
      .select({
        ...getTableColumns(SubscriptionPlansTable),
        count: count(SubscriptionsTable.id).as("count"),
      })
      .from(SubscriptionPlansTable)
      .leftJoin(
        SubscriptionsTable,
        and(
          eq(SubscriptionPlansTable.id, SubscriptionsTable.planId),
          eq(SubscriptionsTable.status, "active"),
        ),
      )
      .where(eq(SubscriptionPlansTable.id, planId))
      .groupBy(SubscriptionPlansTable.id);

    return plan ?? null;
  },

  /**
   * 플랜 생성
   */
  createPlan: async (data: CreateSubscriptionPlan): Promise<any> => {
    const [plan] = await pgDb
      .insert(SubscriptionPlansTable)
      .values(createSubscriptionPlanSchema.parse(data))
      .returning();

    return plan as any;
  },

  /**
   * 플랜 업데이트
   */
  updatePlan: async (
    planId: string,
    data: Partial<UpdateSubscriptionPlan>,
  ): Promise<any> => {
    const [plan] = await pgDb
      .update(SubscriptionPlansTable)
      .set({
        ...updateSubscriptionPlanSchema.parse(data),
        updatedAt: new Date(),
      })
      .where(eq(SubscriptionPlansTable.id, planId))
      .returning();

    if (!plan) {
      throw new Error(`플랜을 찾을 수 없습니다: ${planId}`);
    }
    return plan as any;
  },

  /**
   * 플랜 활성화/비활성화 설정 (멱등성 보장)
   */
  setPlanActive: async (planId: string, isActive: boolean): Promise<any> => {
    const [plan] = await pgDb
      .update(SubscriptionPlansTable)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(SubscriptionPlansTable.id, planId))
      .returning();

    if (!plan) {
      throw new Error(`플랜을 찾을 수 없습니다: ${planId}`);
    }
    return plan as any;
  },
};
