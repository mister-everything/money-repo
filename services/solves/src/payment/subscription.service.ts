import { createCache } from "@workspace/cache";
import { and, eq, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { CacheKeys, CacheTTL } from "./cache-keys";
import { paymentService } from "./payment.service";
import {
  CreditLedgerTable,
  CreditWalletTable,
  SubscriptionPlansTable,
  SubscriptionRefillsTable,
  UserSubscriptionsTable,
} from "./schema";
import type {
  CancelSubscriptionResponse,
  CheckRefillResponse,
  CreateSubscriptionResponse,
  RenewSubscriptionResponse,
  SubscriptionPlan,
  UpgradeSubscriptionResponse,
  UserSubscription,
} from "./types";

// 캐시 인스턴스
const cache = createCache({ forceMemory: true });

/**
 * Subscription Service
 *
 * 단순화된 구독 시스템:
 * - 지갑 1개 (기존 CreditWallet 활용)
 * - 구독 = 정기 크레딧 충전
 * - 기존 paymentService와 완전 호환
 */
export const subscriptionService = {
  /**
   * 구독 플랜 조회 (Cache 우선)
   */
  getPlan: async (planId: string): Promise<SubscriptionPlan> => {
    const cached = await cache.get(CacheKeys.subscriptionPlan(planId));
    if (cached) {
      return JSON.parse(cached);
    }

    const [plan] = await pgDb
      .select()
      .from(SubscriptionPlansTable)
      .where(eq(SubscriptionPlansTable.id, planId))
      .limit(1);

    if (!plan) {
      throw new Error(`플랜을 찾을 수 없습니다: ${planId}`);
    }

    await cache.setex(
      CacheKeys.subscriptionPlan(planId),
      CacheTTL.SUBSCRIPTION_PLAN,
      JSON.stringify(plan),
    );

    return plan as SubscriptionPlan;
  },

  /**
   * 플랜 이름으로 조회
   */
  getPlanByName: async (planName: string): Promise<SubscriptionPlan> => {
    const cached = await cache.get(CacheKeys.subscriptionPlanByName(planName));
    if (cached) {
      return JSON.parse(cached);
    }

    const [plan] = await pgDb
      .select()
      .from(SubscriptionPlansTable)
      .where(
        and(
          eq(SubscriptionPlansTable.name, planName),
          eq(SubscriptionPlansTable.isActive, true),
        ),
      )
      .limit(1);

    if (!plan) {
      throw new Error(`플랜을 찾을 수 없습니다: ${planName}`);
    }

    await cache.setex(
      CacheKeys.subscriptionPlanByName(planName),
      CacheTTL.SUBSCRIPTION_PLAN,
      JSON.stringify(plan),
    );

    return plan as SubscriptionPlan;
  },

  /**
   * 사용자의 지갑 ID 조회 (구독 여부 무관)
   * - 구독 있으면 구독 지갑 반환
   * - 구독 없으면 기존 지갑 조회 (없으면 null)
   */
  getWalletId: async (userId: string): Promise<string | null> => {
    const subscription =
      await subscriptionService.getActiveSubscription(userId);
    if (subscription) {
      return subscription.walletId;
    }

    // 구독 없을 때 기존 지갑 조회
    const [wallet] = await pgDb
      .select()
      .from(CreditWalletTable)
      .where(eq(CreditWalletTable.userId, userId))
      .limit(1);

    return wallet?.id || null;
  },

  /**
   * 사용자의 활성 구독 조회
   */
  getActiveSubscription: async (
    userId: string,
  ): Promise<UserSubscription | null> => {
    const cached = await cache.get(CacheKeys.subscription(userId));
    if (cached) {
      return JSON.parse(cached);
    }

    const [subscription] = await pgDb
      .select()
      .from(UserSubscriptionsTable)
      .where(
        and(
          eq(UserSubscriptionsTable.userId, userId),
          eq(UserSubscriptionsTable.status, "active"),
        ),
      )
      .limit(1);

    if (!subscription) {
      return null;
    }

    await cache.setex(
      CacheKeys.subscription(userId),
      CacheTTL.SUBSCRIPTION,
      JSON.stringify(subscription),
    );

    return subscription as UserSubscription;
  },

  /**
   * 구독 생성
   * - 지갑 1개만 생성 (기존 크레딧 시스템 활용)
   * - 초기 크레딧 지급
   */
  createSubscription: async (
    userId: string,
    planId: string,
  ): Promise<CreateSubscriptionResponse> => {
    // 1) 기존 활성 구독 확인
    const existingSub = await subscriptionService.getActiveSubscription(userId);
    if (existingSub) {
      throw new Error(
        "이미 활성 구독이 있습니다. 플랜 변경은 upgrade를 사용하세요.",
      );
    }

    // 2) 플랜 정보 조회
    const plan = await subscriptionService.getPlan(planId);
    if (!plan.isActive) {
      throw new Error("비활성화된 플랜입니다.");
    }

    // 3) 트랜잭션: 지갑 생성 + 구독 생성 + 크레딧 지급
    const result = await pgDb.transaction(async (tx) => {
      // 3-1) 지갑 생성 (1개만!)
      const [wallet] = await tx
        .insert(CreditWalletTable)
        .values({
          userId,
          balance: "0",
          version: 0,
        })
        .returning({ id: CreditWalletTable.id });

      // 3-2) 구독 생성 (1개월 기간)
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const [subscription] = await tx
        .insert(UserSubscriptionsTable)
        .values({
          userId,
          planId,
          walletId: wallet.id,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          lastRefillAt: now,
        })
        .returning({ id: UserSubscriptionsTable.id });

      // 3-3) 초기 크레딧 지급 (월간 할당량)
      const monthlyQuota = Number(plan.monthlyQuota);
      await tx
        .update(CreditWalletTable)
        .set({
          balance: monthlyQuota.toFixed(6),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, wallet.id));

      // 3-4) 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId: wallet.id,
        kind: "subscription_grant",
        delta: monthlyQuota.toFixed(6),
        runningBalance: monthlyQuota.toFixed(6),
        reason: `${plan.name} 구독 시작 (월간 크레딧)`,
      });

      return {
        subscriptionId: subscription.id,
        walletId: wallet.id,
        initialCredits: monthlyQuota.toFixed(6),
      };
    });

    // 4) 캐시 무효화
    await cache.del(CacheKeys.subscription(userId));

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 구독 갱신 (매월 자동 호출)
   * - rolloverEnabled에 따라 이월 또는 리셋
   */
  renewSubscription: async (
    subscriptionId: string,
  ): Promise<RenewSubscriptionResponse> => {
    const result = await pgDb.transaction(async (tx) => {
      // 1) 구독 정보 조회
      const [subscription] = await tx
        .select()
        .from(UserSubscriptionsTable)
        .where(eq(UserSubscriptionsTable.id, subscriptionId))
        .limit(1);

      if (!subscription) {
        throw new Error("구독을 찾을 수 없습니다.");
      }

      if (subscription.status !== "active") {
        throw new Error("활성 구독이 아닙니다.");
      }

      // 2) 플랜 정보 조회
      const [plan] = await tx
        .select()
        .from(SubscriptionPlansTable)
        .where(eq(SubscriptionPlansTable.id, subscription.planId))
        .limit(1);

      if (!plan) {
        throw new Error("플랜을 찾을 수 없습니다.");
      }

      // 3) 지갑 조회
      const [wallet] = await tx
        .select()
        .from(CreditWalletTable)
        .where(eq(CreditWalletTable.id, subscription.walletId))
        .limit(1);

      if (!wallet) {
        throw new Error("지갑을 찾을 수 없습니다.");
      }

      const oldBalance = Number(wallet.balance);
      const monthlyQuota = Number(plan.monthlyQuota);
      let newBalance: number;
      let creditsGranted: string;

      if (plan.rolloverEnabled) {
        // 4-1) 이월 활성화: 기존 잔액 + 월간 크레딧
        newBalance = oldBalance + monthlyQuota;
        creditsGranted = monthlyQuota.toFixed(6);

        await tx.insert(CreditLedgerTable).values({
          walletId: subscription.walletId,
          kind: "subscription_grant",
          delta: monthlyQuota.toFixed(6),
          runningBalance: newBalance.toFixed(6),
          reason: `월간 구독 갱신 (이월 + 새 크레딧)`,
        });
      } else {
        // 4-2) 이월 비활성화: 기존 잔액 리셋
        if (oldBalance > 0) {
          await tx.insert(CreditLedgerTable).values({
            walletId: subscription.walletId,
            kind: "subscription_reset",
            delta: (-oldBalance).toFixed(6),
            runningBalance: "0",
            reason: "월간 갱신 시 잔액 리셋 (미사용 크레딧 소멸)",
          });
        }

        newBalance = monthlyQuota;
        creditsGranted = monthlyQuota.toFixed(6);

        await tx.insert(CreditLedgerTable).values({
          walletId: subscription.walletId,
          kind: "subscription_grant",
          delta: monthlyQuota.toFixed(6),
          runningBalance: newBalance.toFixed(6),
          reason: "월간 구독 갱신 (새 크레딧)",
        });
      }

      // 5) 지갑 업데이트
      await tx
        .update(CreditWalletTable)
        .set({
          balance: newBalance.toFixed(6),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, subscription.walletId));

      // 6) 구독 기간 연장
      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = new Date(newPeriodStart);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      await tx
        .update(UserSubscriptionsTable)
        .set({
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
          lastRefillAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(UserSubscriptionsTable.id, subscriptionId));

      return {
        newPeriodStart,
        newPeriodEnd,
        creditsGranted,
        newBalance: newBalance.toFixed(6),
      };
    });

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 정기 충전 체크 및 실행
   * - 잔액이 부족할 때 자동 충전
   */
  checkAndRefillCredits: async (
    userId: string,
  ): Promise<CheckRefillResponse> => {
    // 1) 분산 락 체크 (중복 충전 방지)
    const lockKey = CacheKeys.refillLock(userId);
    const hasLock = await cache.get(lockKey);
    if (hasLock) {
      return { refilled: false };
    }

    try {
      // 락 획득
      await cache.setex(lockKey, CacheTTL.REFILL_LOCK, "1");

      // 2) 활성 구독 조회
      const subscription =
        await subscriptionService.getActiveSubscription(userId);
      if (!subscription) {
        return { refilled: false };
      }

      // 3) 플랜 정보 조회
      const plan = await subscriptionService.getPlan(subscription.planId);

      // 4) 마지막 충전 시각 확인
      const now = new Date();
      const lastRefill = subscription.lastRefillAt
        ? new Date(subscription.lastRefillAt)
        : new Date(subscription.currentPeriodStart);

      const hoursSinceLastRefill =
        (now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60);

      // 충전 간격이 안 지났으면 스킵
      if (hoursSinceLastRefill < plan.refillIntervalHours) {
        const nextRefillAt = new Date(
          lastRefill.getTime() + plan.refillIntervalHours * 60 * 60 * 1000,
        );
        return {
          refilled: false,
          nextRefillAt,
        };
      }

      // 5) 현재 잔액 확인 (기존 paymentService 활용)
      const currentBalance = Number(
        await paymentService.getBalance(subscription.walletId),
      );
      const maxRefillBalance = Number(plan.maxRefillBalance);

      // 최대 누적 잔액을 초과하면 충전 안함
      if (currentBalance >= maxRefillBalance) {
        return {
          refilled: false,
          newBalance: currentBalance.toFixed(6),
        };
      }

      // 6) 트랜잭션: 정기 충전
      const result = await pgDb.transaction(async (tx) => {
        const refillAmount = Number(plan.refillAmount);
        const newBalance = currentBalance + refillAmount;

        // 6-1) 지갑 업데이트 (낙관적 락)
        const [wallet] = await tx
          .select()
          .from(CreditWalletTable)
          .where(eq(CreditWalletTable.id, subscription.walletId))
          .limit(1);

        if (!wallet) {
          throw new Error("지갑을 찾을 수 없습니다.");
        }

        await tx
          .update(CreditWalletTable)
          .set({
            balance: newBalance.toFixed(6),
            version: wallet.version + 1,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(CreditWalletTable.id, subscription.walletId),
              eq(CreditWalletTable.version, wallet.version),
            ),
          );

        // 6-2) 원장 기록
        await tx.insert(CreditLedgerTable).values({
          walletId: subscription.walletId,
          kind: "subscription_refill",
          delta: refillAmount.toFixed(6),
          runningBalance: newBalance.toFixed(6),
          reason: `정기 자동 충전 (${plan.refillIntervalHours}시간마다)`,
        });

        // 6-3) 충전 이력 기록
        await tx.insert(SubscriptionRefillsTable).values({
          subscriptionId: subscription.id,
          walletId: subscription.walletId,
          refillAmount: refillAmount.toFixed(6),
          balanceBefore: currentBalance.toFixed(6),
          balanceAfter: newBalance.toFixed(6),
        });

        // 6-4) 구독 lastRefillAt 업데이트
        await tx
          .update(UserSubscriptionsTable)
          .set({
            lastRefillAt: now,
            updatedAt: new Date(),
          })
          .where(eq(UserSubscriptionsTable.id, subscription.id));

        return {
          refillAmount: refillAmount.toFixed(6),
          newBalance: newBalance.toFixed(6),
        };
      });

      // 7) 캐시 무효화
      await Promise.all([
        cache.del(CacheKeys.subscription(userId)),
        cache.del(CacheKeys.walletBalance(subscription.walletId)),
      ]);

      const nextRefillAt = new Date(
        now.getTime() + plan.refillIntervalHours * 60 * 60 * 1000,
      );

      return {
        refilled: true,
        ...result,
        nextRefillAt,
      };
    } finally {
      // 락 해제
      await cache.del(lockKey);
    }
  },

  /**
   * 구독 취소
   */
  cancelSubscription: async (
    subscriptionId: string,
  ): Promise<CancelSubscriptionResponse> => {
    const result = await pgDb.transaction(async (tx) => {
      const [subscription] = await tx
        .select()
        .from(UserSubscriptionsTable)
        .where(eq(UserSubscriptionsTable.id, subscriptionId))
        .limit(1);

      if (!subscription) {
        throw new Error("구독을 찾을 수 없습니다.");
      }

      if (subscription.status !== "active") {
        throw new Error("이미 취소되었거나 만료된 구독입니다.");
      }

      const now = new Date();
      await tx
        .update(UserSubscriptionsTable)
        .set({
          status: "canceled",
          canceledAt: now,
          updatedAt: now,
        })
        .where(eq(UserSubscriptionsTable.id, subscriptionId));

      return {
        canceledAt: now,
        validUntil: subscription.currentPeriodEnd,
      };
    });

    // 캐시 무효화
    const [subscription] = await pgDb
      .select()
      .from(UserSubscriptionsTable)
      .where(eq(UserSubscriptionsTable.id, subscriptionId))
      .limit(1);

    if (subscription) {
      await cache.del(CacheKeys.subscription(subscription.userId));
    }

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 플랜 업그레이드/다운그레이드
   * - Pro-rate 조정
   */
  upgradeSubscription: async (
    userId: string,
    newPlanId: string,
  ): Promise<UpgradeSubscriptionResponse> => {
    const result = await pgDb.transaction(async (tx) => {
      // 1) 현재 구독 조회
      const [subscription] = await tx
        .select()
        .from(UserSubscriptionsTable)
        .where(
          and(
            eq(UserSubscriptionsTable.userId, userId),
            eq(UserSubscriptionsTable.status, "active"),
          ),
        )
        .limit(1);

      if (!subscription) {
        throw new Error("활성 구독이 없습니다.");
      }

      // 2) 기존 플랜과 새 플랜 조회
      const [oldPlan] = await tx
        .select()
        .from(SubscriptionPlansTable)
        .where(eq(SubscriptionPlansTable.id, subscription.planId))
        .limit(1);

      const [newPlan] = await tx
        .select()
        .from(SubscriptionPlansTable)
        .where(eq(SubscriptionPlansTable.id, newPlanId))
        .limit(1);

      if (!oldPlan || !newPlan) {
        throw new Error("플랜을 찾을 수 없습니다.");
      }

      if (!newPlan.isActive) {
        throw new Error("비활성화된 플랜입니다.");
      }

      // 3) 현재 잔액 확인
      const [wallet] = await tx
        .select()
        .from(CreditWalletTable)
        .where(eq(CreditWalletTable.id, subscription.walletId))
        .limit(1);

      if (!wallet) {
        throw new Error("지갑을 찾을 수 없습니다.");
      }

      // 4) Pro-rate 조정 계산
      const currentBalance = Number(wallet.balance);
      const oldMonthlyQuota = Number(oldPlan.monthlyQuota);
      const newMonthlyQuota = Number(newPlan.monthlyQuota);

      const now = new Date();
      const periodStart = new Date(subscription.currentPeriodStart);
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const totalDays =
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
      const remainingDays =
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const periodRatio = remainingDays / totalDays;

      const creditDiff =
        (newMonthlyQuota - oldMonthlyQuota) * Math.max(periodRatio, 0);
      const newBalance = currentBalance + creditDiff;

      // 5) 크레딧 조정
      await tx
        .update(CreditWalletTable)
        .set({
          balance: Math.max(newBalance, 0).toFixed(6),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, subscription.walletId));

      // 6) 원장 기록
      if (creditDiff !== 0) {
        await tx.insert(CreditLedgerTable).values({
          walletId: subscription.walletId,
          kind: creditDiff > 0 ? "subscription_grant" : "adjustment",
          delta: creditDiff.toFixed(6),
          runningBalance: Math.max(newBalance, 0).toFixed(6),
          reason: `플랜 변경: ${oldPlan.name} → ${newPlan.name} (Pro-rate 조정)`,
        });
      }

      // 7) 구독 플랜 업데이트
      await tx
        .update(UserSubscriptionsTable)
        .set({
          planId: newPlanId,
          updatedAt: new Date(),
        })
        .where(eq(UserSubscriptionsTable.id, subscription.id));

      return {
        subscriptionId: subscription.id,
        newPlanId,
        creditAdjustment: creditDiff.toFixed(6),
        newBalance: Math.max(newBalance, 0).toFixed(6),
      };
    });

    // 캐시 무효화
    await Promise.all([
      cache.del(CacheKeys.subscription(userId)),
      paymentService.invalidateWalletCache(
        (await subscriptionService.getActiveSubscription(userId))?.walletId ||
          "",
      ),
    ]);

    return {
      success: true,
      ...result,
    };
  },

  /**
   * 만료된 구독 일괄 처리 (Cron Job용)
   */
  expireSubscriptions: async (): Promise<number> => {
    const now = new Date();

    const result = await pgDb
      .update(UserSubscriptionsTable)
      .set({
        status: "expired",
        updatedAt: now,
      })
      .where(
        and(
          eq(UserSubscriptionsTable.status, "canceled"),
          sql`${UserSubscriptionsTable.currentPeriodEnd} <= ${now}`,
        ),
      );

    return result.rowCount || 0;
  },
};
