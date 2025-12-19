import { PublicError } from "@workspace/error";
import { eq, sql } from "drizzle-orm";
import { CacheKeys, CacheTTL } from "../cache-keys";
import { pgDb } from "../db";
import { createLogger } from "../logger";
import { sharedCache } from "../shared-cache";
import {
  CreditLedgerTable,
  CreditWalletTable,
  UsageEventsTable,
} from "./schema";
import { calculateCost, toDecimal } from "./shared";
import { AIPrice, TxnKind } from "./types";

const logger = createLogger("creadit", "bgCyanBright");

/**
 * Credit Service
 *
 * 핵심 전략:
 * - 빠른 응답: 백그라운드 차감 (balance > 0만 체크)
 * - 안전한 충전: 비관적 락 + 순차 처리
 */
export const creditService = {
  /**
   * AI 사용 크레딧 차감
   * @param params - 차감 파라미터
   * @returns 사용 이벤트 정보
   */
  consumeAICredit: async (params: {
    walletId: string;
    userId: string;
    inputTokens: number;
    outputTokens: number;
    price: AIPrice;
    vendorCost?: number;
    calls?: number;
    idempotencyKey?: string;
  }) => {
    const {
      walletId,
      userId,
      inputTokens,
      vendorCost,
      outputTokens,
      price,
      calls = 0,
      idempotencyKey,
    } = params;

    // 멱등키가 없으면 자동 생성
    const finalIdempotencyKey =
      idempotencyKey ||
      `ai_usage_chat_${userId}_${Date.now()}_${price.id}_${walletId}`;

    // 1) 비용 계산
    const cost = calculateCost(price, {
      input: inputTokens,
      output: outputTokens,
    });

    // 2) DB 트랜잭션 (FOR UPDATE로 충분)
    const result = await pgDb.transaction(async (tx) => {
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
      }>(sql`
        SELECT id, balance FROM ${CreditWalletTable}
        WHERE id = ${walletId}
        FOR UPDATE
      `);

      const wallet = queryResult.rows[0];
      if (!wallet) throw new PublicError("지갑을 찾을 수 없습니다");

      const currentBalance = Number(wallet.balance);
      if (currentBalance <= 0) {
        throw new PublicError("크레딧이 부족합니다");
      }

      const newBalance = Math.max(0, currentBalance - cost.totalMarketCost);
      // 4-3) 원장 기록
      await tx.insert(CreditLedgerTable).values({
        walletId,
        userId,
        kind: TxnKind.debit,
        delta: toDecimal(-cost.totalMarketCost),
        runningBalance: toDecimal(newBalance),
        idempotencyKey: finalIdempotencyKey,
      });

      // 4-2) 잔액 차감
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, walletId));

      // 4-4) 사용 이벤트 기록
      const [usage] = await tx
        .insert(UsageEventsTable)
        .values({
          userId,
          priceId: price.id,
          provider: price.provider,
          model: price.model,
          calls,
          billableCredits: toDecimal(cost.totalMarketCost),
          inputTokens,
          outputTokens,
          vendorCost: toDecimal(vendorCost || cost.totalCost),
        })
        .returning({ id: UsageEventsTable.id });

      return { usageId: usage.id, newBalance: toDecimal(newBalance) };
    });

    // 5) 캐시 업데이트
    const response = {
      success: true,
      usageId: result.usageId,
      newBalance: result.newBalance,
    };
    logger.info(
      `${price.displayName}: ${(cost.totalMarketCost * 1450).toFixed(2)}원 \ncost: ${cost.totalMarketCost.toFixed(8)}, vendorCost: ${vendorCost}, marketCost: ${cost.totalMarketCost - (vendorCost || cost.totalCost)}, balance: ${result.newBalance}
      inputTokens: ${inputTokens}, outputTokens: ${outputTokens}
      `,
    );

    await sharedCache.setex(
      CacheKeys.userWallet(userId),
      CacheTTL.USER_WALLET,
      JSON.stringify({
        id: walletId,
        userId: userId,
        balance: result.newBalance,
      }),
    );

    return response;
  },
};
