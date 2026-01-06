import { userService } from "@service/auth";
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
import { walletService } from "./wallet.service";

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

  /**
   * 관리자용 크레딧 충전
   * - 원장 기록 후 잔액 업데이트 (append-only ledger → balance)
   */
  grantCredit: async (params: {
    userId: string;
    amount: number;
    reason: string;
    idempotencyKey?: string;
    kind?: TxnKind;
  }) => {
    const {
      userId,
      amount,
      reason,
      idempotencyKey,
      kind = TxnKind.grant,
    } = params;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new PublicError("충전 금액은 0보다 커야 합니다");
    }
    // 지갑 없으면 생성 - 여기서 만들지 좀더 고민
    const wallet = await walletService.getOrCreateWallet(userId);

    const finalIdempotencyKey =
      idempotencyKey ||
      `admin_grant_charge_${userId}_${Math.floor(Date.now() / 1000)}`;

    const { newBalance, ledgerId } = await pgDb.transaction(async (tx) => {
      const queryResult = await tx.execute<{
        id: string;
        balance: string;
      }>(sql`
          SELECT id, balance FROM ${CreditWalletTable}
          WHERE id = ${wallet.id}
          FOR UPDATE
        `);

      const lockedWallet = queryResult.rows[0];
      if (!lockedWallet) throw new PublicError("지갑을 찾을 수 없습니다");

      const currentBalance = Number(lockedWallet.balance);
      const nextBalance = currentBalance + amount;

      // 원장 먼저
      const [ledger] = await tx
        .insert(CreditLedgerTable)
        .values({
          walletId: wallet.id,
          userId,
          kind,
          delta: toDecimal(amount),
          runningBalance: toDecimal(nextBalance),
          reason,
          idempotencyKey: finalIdempotencyKey,
        })
        .returning({ id: CreditLedgerTable.id });

      // 잔액 업데이트
      await tx
        .update(CreditWalletTable)
        .set({
          balance: toDecimal(nextBalance),
          updatedAt: new Date(),
        })
        .where(eq(CreditWalletTable.id, wallet.id));

      return { newBalance: toDecimal(nextBalance), ledgerId: ledger.id };
    });

    await sharedCache.setex(
      CacheKeys.userWallet(userId),
      CacheTTL.USER_WALLET,
      JSON.stringify({
        id: wallet.id,
        userId,
        balance: newBalance,
      }),
    );

    return { newBalance, ledgerId };
  },
};
