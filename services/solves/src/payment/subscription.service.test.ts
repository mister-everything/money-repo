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
const { subscriptionService } = await import("./subscription.service");

describe("SubscriptionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCacheStorage.clear();
  });

  describe("getPlan", () => {
    it("should return cached plan", async () => {
      const mockPlan = {
        id: "plan-id",
        name: "pro",
        displayName: "Pro Plan",
        priceUsd: "10000.000000",
        monthlyQuota: "10000.000000",
        refillAmount: "500.000000",
        refillIntervalHours: 6,
        maxRefillBalance: "2000.000000",
        rolloverEnabled: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockCache.set("plan:plan-id", JSON.stringify(mockPlan));

      const plan = await subscriptionService.getPlan("plan-id");

      expect(plan).toEqual(mockPlan);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache on miss", async () => {
      const mockPlan = {
        id: "plan-id-2",
        name: "free",
        displayName: "Free Plan",
        priceUsd: "0.000000",
        monthlyQuota: "1000.000000",
        refillAmount: "50.000000",
        refillIntervalHours: 6,
        maxRefillBalance: "200.000000",
        rolloverEnabled: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([mockPlan]),
      });

      const plan = await subscriptionService.getPlan("plan-id-2");

      expect(plan).toEqual(mockPlan);
      expect(mockDb.select).toHaveBeenCalled();

      // 캐시에 저장되었는지 확인
      const cached = await mockCache.get("plan:plan-id-2");
      expect(JSON.parse(cached!)).toEqual(mockPlan);
    });

    it("should throw error when plan not found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      await expect(subscriptionService.getPlan("invalid-plan")).rejects.toThrow(
        "플랜을 찾을 수 없습니다",
      );
    });
  });

  describe("getPlanByName", () => {
    it("should return cached plan by name", async () => {
      const mockPlan = {
        id: "plan-id",
        name: "pro",
        displayName: "Pro Plan",
        priceUsd: "10000.000000",
        monthlyQuota: "10000.000000",
        refillAmount: "500.000000",
        refillIntervalHours: 6,
        maxRefillBalance: "2000.000000",
        rolloverEnabled: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockCache.set("plan:name:pro", JSON.stringify(mockPlan));

      const plan = await subscriptionService.getPlanByName("pro");

      expect(plan).toEqual(mockPlan);
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe("getActiveSubscription", () => {
    it("should return null when no subscription found", async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce([]),
      });

      const subscription =
        await subscriptionService.getActiveSubscription("user-id");

      expect(subscription).toBeNull();
    });

    it("should return cached subscription", async () => {
      const mockSubscription = {
        id: "sub-id",
        userId: "user-id",
        planId: "plan-id",
        walletId: "wallet-id",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        lastRefillAt: new Date(),
        canceledAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await mockCache.set(
        "subscription:user-id",
        JSON.stringify(mockSubscription),
      );

      const subscription =
        await subscriptionService.getActiveSubscription("user-id");

      expect(subscription).toEqual(mockSubscription);
      expect(mockDb.select).not.toHaveBeenCalled();
    });
  });

  describe("createSubscription", () => {
    it("should throw error if active subscription exists", async () => {
      const mockSubscription = {
        id: "sub-id",
        userId: "user-id",
        status: "active",
      };

      await mockCache.set(
        "subscription:user-id",
        JSON.stringify(mockSubscription),
      );

      await expect(
        subscriptionService.createSubscription("user-id", "plan-id"),
      ).rejects.toThrow("이미 활성 구독이 있습니다");
    });
  });

  describe("cancelSubscription", () => {
    it("should throw error when subscription not found", async () => {
      mockDb.transaction.mockImplementation(async (callback: any) => {
        const tx = {
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValueOnce([]),
          }),
        };
        return callback(tx);
      });

      await expect(
        subscriptionService.cancelSubscription("invalid-sub-id"),
      ).rejects.toThrow("구독을 찾을 수 없습니다");
    });
  });
});
