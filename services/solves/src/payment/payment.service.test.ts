import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock cache
const mockCacheStorage = new Map<string, string>();
const mockCache = {
  get: vi.fn(async (key: string) => mockCacheStorage.get(key) || null),
  set: vi.fn(async (key: string, value: string) => {
    mockCacheStorage.set(key, value);
  }),
  setex: vi.fn(async (key: string, _ttl: number, value: string) => {
    mockCacheStorage.set(key, value);
  }),
  del: vi.fn(async (key: string) => {
    mockCacheStorage.delete(key);
  }),
  delMany: vi.fn(async (keys: string[]) => {
    for (const key of keys) {
      mockCacheStorage.delete(key);
    }
  }),
  close: vi.fn(async () => {}),
};

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  transaction: vi.fn(),
  execute: vi.fn(),
};

// Mock modules
vi.mock("@workspace/cache", () => ({
  createCache: () => mockCache,
}));

vi.mock("../db", () => ({
  pgDb: mockDb,
}));

// Import after mocking
const { paymentService } = await import("./payment.service");

describe("PaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 캐시 초기화
    mockCacheStorage.clear();
  });

  describe("getBalance", () => {
    it("should return cached balance", async () => {
      // 캐시에 잔액 미리 저장
      await mockCache.set("wallet:wallet-id:balance", "1000.000000");

      const balance = await paymentService.getBalance("wallet-id");

      expect(balance).toBe("1000.000000");
      // DB 호출 안됨
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache on miss", async () => {
      const mockWallet = { balance: "500.000000" };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockWallet]),
      });

      const balance = await paymentService.getBalance("wallet-id-2");

      expect(balance).toBe("500.000000");
      expect(mockDb.select).toHaveBeenCalled();

      // 캐시에 저장되었는지 확인
      const cached = await mockCache.get("wallet:wallet-id-2:balance");
      expect(cached).toBe("500.000000");
    });

    it("should throw error when wallet not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(paymentService.getBalance("invalid-wallet")).rejects.toThrow(
        "지갑을 찾을 수 없습니다",
      );
    });
  });

  describe("getAIPrice", () => {
    it("should return cached price", async () => {
      const mockPrice = {
        id: "price-id",
        provider: "openai",
        model: "gpt-4o-mini",
        modelType: "text",
        inputTokenPrice: "0.00015000",
        outputTokenPrice: "0.00060000",
        markupRate: "1.60",
        isActive: true,
      };

      await mockCache.set(
        "price:openai:gpt-4o-mini",
        JSON.stringify(mockPrice),
      );

      const price = await paymentService.getAIPrice("openai", "gpt-4o-mini");

      expect(price).toEqual(mockPrice);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache on miss", async () => {
      const mockPrice = {
        id: "price-id",
        provider: "anthropic",
        model: "claude-3-5-sonnet",
        modelType: "text",
        inputTokenPrice: "0.00300000",
        outputTokenPrice: "0.01500000",
        markupRate: "1.60",
        isActive: true,
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockPrice]),
      });

      const price = await paymentService.getAIPrice(
        "anthropic",
        "claude-3-5-sonnet",
      );

      expect(price).toEqual(mockPrice);
      expect(mockDb.select).toHaveBeenCalled();

      // 캐시에 저장되었는지 확인
      const cached = await mockCache.get("price:anthropic:claude-3-5-sonnet");
      expect(JSON.parse(cached!)).toEqual(mockPrice);
    });

    it("should throw error when price not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(
        paymentService.getAIPrice("unknown", "model"),
      ).rejects.toThrow("가격 정보를 찾을 수 없습니다");
    });
  });

  describe("deductCredit", () => {
    it("should return cached response for duplicate request", async () => {
      const cachedResponse = { success: true, usageId: "usage-123" };
      await mockCache.set("idemp:req-123", JSON.stringify(cachedResponse));

      const result = await paymentService.deductCredit({
        walletId: "wallet-id",
        userId: "user-id",
        provider: "openai",
        model: "gpt-4o-mini",
        inputTokens: 1000,
        outputTokens: 500,
        idempotencyKey: "req-123",
      });

      expect(result).toEqual(cachedResponse);
      // DB 호출 안됨
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it("should throw error when insufficient balance", async () => {
      // 가격 정보 캐싱
      const mockPrice = {
        id: "price-id",
        provider: "openai",
        model: "gpt-4o-mini",
        inputTokenPrice: "0.00015000",
        outputTokenPrice: "0.00060000",
        markupRate: "1.60",
      };
      await mockCache.set(
        "price:openai:gpt-4o-mini",
        JSON.stringify(mockPrice),
      );

      // 지갑 조회 - 잔액 부족
      mockDb.transaction.mockImplementation(async (callback: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi
              .fn()
              .mockResolvedValueOnce([{ balance: "0.000001", version: 1 }]),
          }),
        };
        return callback(tx);
      });

      await expect(
        paymentService.deductCredit({
          walletId: "wallet-id",
          userId: "user-id",
          provider: "openai",
          model: "gpt-4o-mini",
          inputTokens: 100000,
          outputTokens: 50000,
          idempotencyKey: "req-new",
        }),
      ).rejects.toThrow("크레딧이 부족합니다");
    });
  });

  describe("creditPurchase", () => {
    it("should return cached response for duplicate request", async () => {
      const cachedResponse = { success: true, newBalance: 1000 };
      await mockCache.set("idemp:purchase-123", JSON.stringify(cachedResponse));

      const result = await paymentService.creditPurchase({
        walletId: "wallet-id",
        userId: "user-id",
        creditAmount: 500,
        invoiceId: "invoice-123",
        idempotencyKey: "purchase-123",
      });

      expect(result).toEqual(cachedResponse);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });
  });

  describe("cache invalidation", () => {
    it("should invalidate wallet cache", async () => {
      // 캐시에 데이터 저장
      await mockCache.set("wallet:wallet-id:balance", "1000");

      // 무효화
      await paymentService.invalidateWalletCache("wallet-id");

      // 캐시에서 삭제되었는지 확인
      const cached = await mockCache.get("wallet:wallet-id:balance");
      expect(cached).toBeNull();
    });

    it("should invalidate price cache", async () => {
      // 캐시에 데이터 저장
      await mockCache.set("price:openai:gpt-4o-mini", '{"price": 0.15}');

      // 무효화
      await paymentService.invalidatePriceCache("openai", "gpt-4o-mini");

      // 캐시에서 삭제되었는지 확인
      const cached = await mockCache.get("price:openai:gpt-4o-mini");
      expect(cached).toBeNull();
    });
  });
});
