import { and, eq, sql } from "drizzle-orm";
import { pgDb } from "../db";
import { CacheKeys, CacheTTL } from "./cache-keys";
import {
  AiProviderPricesTable,
  CreditLedgerTable,
  CreditWalletTable,
  InvoicesTable,
  UsageEventsTable,
} from "./schema";
import { sharedCache } from "./shared-cache";
import type {
  AIPrice,
  CreditPurchaseParams,
  CreditPurchaseResponse,
  DeductCreditAsyncResponse,
  DeductCreditParams,
  DeductCreditResponse,
} from "./types";
import { PriceCalculator, toDecimal } from "./utils";

/**
 * Credit Service
 *
 * 핵심 전략:
 * - 빠른 응답: 백그라운드 차감 (balance > 0만 체크)
 * - 안전한 충전: 비관적 락 + 순차 처리
 * - 멱등성 보장: 캐시 + DB 인덱스
 * - 낙관적 락: 차감 시 version 활용
 */
export const creditService = {
  /**
   * 잔액 조회 (Cache 우선 → DB Fallback)
   * @param walletId - 지갑 UUID
   * @returns 잔액 (문자열)
   */
  getBalance: async (walletId: string): Promise<string> => {
    // 1) 캐시에서 먼저 확인
    const cached = await sharedCache.get(CacheKeys.walletBalance(walletId));
    if (cached) {
      return cached;
    }

    // 2) 캐시 미스 → DB 조회
    const [wallet] = await pgDb
      .select({ balance: CreditWalletTable.balance })
      .from(CreditWalletTable)
      .where(eq(CreditWalletTable.id, walletId))
      .limit(1);

    if (!wallet) {
      throw new Error("지갑을 찾을 수 없습니다");
    }

    // 3) 캐시 저장 (10분)
    await sharedCache.setex(
      CacheKeys.walletBalance(walletId),
      CacheTTL.WALLET_BALANCE,
      wallet.balance,
    );

    return wallet.balance;
  },

  /**
   * AI 가격 조회 (Cache 우선)
   * @param provider - AI 제공자
   * @param model - 모델명
   * @returns 가격 정보
   */
  getAIPrice: async (provider: string, model: string): Promise<AIPrice> => {
    // 1) 캐시 확인
    const cached = await sharedCache.get(CacheKeys.aiPrice(provider, model));
    if (cached) {
      return JSON.parse(cached);
    }

    // 2) DB 조회
    const [price] = await pgDb
      .select()
      .from(AiProviderPricesTable)
      .where(
        and(
          eq(AiProviderPricesTable.provider, provider),
          eq(AiProviderPricesTable.model, model),
          eq(AiProviderPricesTable.isActive, true),
        ),
      )
      .limit(1);

    if (!price) {
      throw new Error(`가격 정보를 찾을 수 없습니다: ${provider}/${model}`);
    }

    // 3) 캐시 저장 (1시간)
    await sharedCache.setex(
      CacheKeys.aiPrice(provider, model),
      CacheTTL.AI_PRICE,
      JSON.stringify(price),
    );

    return price as AIPrice;
  },

  /**
   * 크레딧 차감 - 백그라운드 (빠른 응답)
   * @param params - 차감 파라미터
   * @returns 즉시 응답
   */
  deductCreditAsync: async (
    params: DeductCreditParams,
  ): Promise<DeductCreditAsyncResponse> => {
    const { walletId, idempotencyKey } = params;

    // 1) 멱등성 체크 (빠른 중복 방지)
    const cached = await sharedCache.get(CacheKeys.idempotency(idempotencyKey));
    if (cached) {
      const response = JSON.parse(cached) as DeductCreditResponse;
      return {
        success: true,
        estimatedBalance: response.newBalance,
      };
    }

    // 2) 잔액 체크 (캐시 우선)
    const balance = await creditService.getBalance(walletId);
    if (Number(balance) <= 0) {
      throw new Error("크레딧이 부족합니다");
    }

    // 3) 즉시 응답 (백그라운드에서 실제 차감 예정)
    const estimatedBalance = balance;

    // 4) 백그라운드 차감 실행 (Promise를 기다리지 않음)
    creditService
      .deductCreditSync(params)
      .then((result) => {
        // 성공: 로그 기록
        console.log(
          `[Background Deduction] Success: ${result.usageId}, Balance: ${result.newBalance}`,
        );
      })
      .catch((error: unknown) => {
        // 실패: 에러 로그 + 알림
        console.error("[Background Deduction] Failed:", error);
        // TODO: 실패 시 알림/모니터링 시스템에 전송
      });

    return {
      success: true,
      estimatedBalance,
    };
  },

  /**
   * 크레딧 차감 - 동기 (실제 차감 로직)
   * @param params - 차감 파라미터
   * @returns 사용 이벤트 정보
   */
  deductCreditSync: async (
    params: DeductCreditParams,
  ): Promise<DeductCreditResponse> => {
    const {
      walletId,
      userId,
      provider,
      model,
      inputTokens,
      outputTokens,
      cachedTokens = 0,
      calls = 0,
      idempotencyKey,
    } = params;

    // 1) 캐시에서 멱등성 체크
    const cachedResponse = await sharedCache.get(
      CacheKeys.idempotency(idempotencyKey),
    );
    if (cachedResponse) {
      return JSON.parse(cachedResponse);
    }

    // 2) 가격 조회 (캐시 활용)
    const price = await creditService.getAIPrice(provider, model);

    // 3) 비용 계산
    const { vendorCostUsd, billableCredits } =
      PriceCalculator.calculateCreditsFromTokens(price, {
        input: inputTokens,
        output: outputTokens,
      });

    // 4) DB 트랜잭션 (FOR UPDATE로 충분)
    const result = await pgDb.transaction(async (tx) => {
      // 4-1) 지갑 조회 (충전/리필 중이면 대기)
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
        version: number;
      }>(sql`
        SELECT id, balance, version FROM ${CreditWalletTable}
        WHERE id = ${walletId}
        FOR UPDATE
      `);

      const wallet = queryResult.rows[0];
      if (!wallet) throw new Error("지갑을 찾을 수 없습니다");

      const currentBalance = Number(wallet.balance);
      if (currentBalance < billableCredits) {
        throw new Error("크레딧이 부족합니다");
      }

      const newBalance = currentBalance - billableCredits;

      // 4-2) 잔액 차감 (version만 증가)
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(newBalance),
          version: wallet.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, walletId));

      // 4-3) 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId,
        kind: "debit",
        delta: toDecimal(-billableCredits),
        runningBalance: toDecimal(newBalance),
        idempotencyKey,
        reason: `AI usage: ${provider}:${model}`,
      });

      // 4-4) 사용 이벤트 기록
      const [usage] = await tx
        .insert(UsageEventsTable)
        .values({
          userId,
          walletId,
          priceId: price.id,
          provider,
          model,
          inputTokens,
          outputTokens,
          cachedTokens,
          calls,
          vendorCostUsd: toDecimal(vendorCostUsd),
          billableCredits: toDecimal(billableCredits),
          idempotencyKey,
        })
        .returning({ id: UsageEventsTable.id });

      return { usageId: usage.id, newBalance: toDecimal(newBalance) };
    });

    // 5) 캐시 업데이트
    const response: DeductCreditResponse = {
      success: true,
      usageId: result.usageId,
      newBalance: result.newBalance,
    };

    await Promise.all([
      // 5-1) 잔액 캐시 갱신
      sharedCache.setex(
        CacheKeys.walletBalance(walletId),
        CacheTTL.WALLET_BALANCE,
        result.newBalance,
      ),
      // 5-2) 멱등성 키 저장
      sharedCache.setex(
        CacheKeys.idempotency(idempotencyKey),
        CacheTTL.IDEMPOTENCY,
        JSON.stringify(response),
      ),
    ]);

    return response;
  },

  /**
   * 크레딧 충전 (결제 완료 시 호출)
   * 순차 처리 - 비관적 락 사용
   * @param params - 충전 파라미터
   * @returns 새로운 잔액
   */
  creditPurchase: async (
    params: CreditPurchaseParams,
  ): Promise<CreditPurchaseResponse> => {
    const { walletId, creditAmount, invoiceId, idempotencyKey } = params;

    // 1) 멱등성 체크
    const cached = await sharedCache.get(CacheKeys.idempotency(idempotencyKey));
    if (cached) return JSON.parse(cached);

    // 2) DB 트랜잭션 (비관적 락 - 충전은 충돌 거의 없음)
    const result = await pgDb.transaction(async (tx) => {
      // 2-1) 지갑 조회 (FOR UPDATE)
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
        version: number;
      }>(sql`
        SELECT id, balance, version FROM ${CreditWalletTable}
        WHERE id = ${walletId}
        FOR UPDATE
      `);

      const wallet = queryResult.rows[0];
      if (!wallet) throw new Error("지갑을 찾을 수 없습니다");

      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + creditAmount;

      // 2-2) 잔액 증가
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(newBalance),
          version: wallet.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, walletId));

      // 2-3) 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId,
        kind: "purchase",
        delta: toDecimal(creditAmount),
        runningBalance: toDecimal(newBalance),
        idempotencyKey,
        reason: `invoice:${invoiceId}`,
      });

      // 2-4) 인보이스 상태 업데이트 (paid)
      await tx
        .update(InvoicesTable)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(InvoicesTable.id, invoiceId));

      return { newBalance };
    });

    const response: CreditPurchaseResponse = {
      success: true,
      newBalance: result.newBalance,
    };

    // 3) 캐시 갱신
    await Promise.all([
      sharedCache.setex(
        CacheKeys.walletBalance(walletId),
        CacheTTL.WALLET_BALANCE,
        toDecimal(result.newBalance),
      ),
      sharedCache.setex(
        CacheKeys.idempotency(idempotencyKey),
        CacheTTL.IDEMPOTENCY,
        JSON.stringify(response),
      ),
    ]);

    return response;
  },
};
