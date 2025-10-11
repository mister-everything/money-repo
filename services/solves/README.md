# @service/solves

문제 출제(Prob) + AI 크레딧 결제(Payment) 서비스

## 📦 Architecture

```
src/
├── prob/              # 문제 출제 모듈
│   ├── types.ts       # 공통 타입/스키마 (Server/Client)
│   ├── schema.ts      # DB 스키마 (Server only)
│   ├── blocks.ts      # 블록 타입 정의 (MultipleChoice, ShortAnswer 등)
│   ├── prob.service.ts
│   └── seed-prob.ts
│
├── payment/           # AI 크레딧 결제 모듈
│   ├── types.ts       # 공통 타입/스키마 (Server/Client)
│   ├── schema.ts      # DB 스키마 (Server only)
│   ├── cache-keys.ts  # Redis/Cache 키 관리
│   ├── payment.service.ts
│   └── seed-prices.ts
│
├── db.ts              # Drizzle DB 인스턴스
├── seed.ts            # 통합 Seed 진입점
└── index.ts           # 전체 Export
```

## 🎯 Features

### Prob Module

- **문제집(ProbBook) + 문제블록(ProbBlock)** 구조
- **다양한 블록 타입**: MultipleChoice, ShortAnswer, Essay 등
- **태그 시스템** 및 공개/비공개 설정
- **Owner 기반** 권한 관리

### Payment Module

- **AI Provider 가격 관리** (OpenAI, Anthropic 등)
- **크레딧 지갑** + 원장(Ledger) 시스템
- **멱등성 보장** (Redis + DB 이중화)
- **동시성 제어** (낙관적 락 + 재시도)
- **Redis 캐싱** (잔액, 가격표, 멱등성 키)

## 🚀 Quick Start

### 1. 환경 설정

```bash
# Redis (Optional - 없으면 MemoryCache 사용)
REDIS_URL=redis://localhost:6379

# PostgreSQL (Required)
DATABASE_URL=postgresql://...
```

### 2. DB 초기화

```bash
pnpm db:generate  # 마이그레이션 생성
pnpm db:migrate   # 마이그레이션 실행
pnpm db:seed      # 샘플 데이터 생성 (interactive)
```

### 3. Next.js에서 사용

```typescript
// ✅ Server Component / API Route
import { probService, paymentService } from "@service/solves";

const books = await probService.getProbBooks({ isPublic: true });
const balance = await paymentService.getBalance(walletId);

// ✅ Client Component
import type { ProbBook, AIPrice, DeductCreditParams } from "@service/solves";

const MyComponent = ({ book }: { book: ProbBook }) => { ... };
```

## 📝 Code Style Guide

### 1. 타입 분리 원칙

**`types.ts`**: Server/Client 공통 사용 (Next.js 환경 고려)

- Interface, Type Alias
- Zod Schema (validation + type inference)

**`schema.ts`**: Server only (DB 스키마)

- Drizzle ORM 테이블 정의
- DB 전용 타입

```typescript
// ✅ types.ts (공통)
export const createProbBookSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});
export type CreateProbBook = z.infer<typeof createProbBookSchema>;

export interface ProbBook {
  id: string;
  title: string;
  // ...
}

// ✅ schema.ts (Server)
export const ProbBookTable = pgTable("prob_books", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  // ...
});
```

### 2. Service Layer 패턴

**Object Literal 스타일** (클래스 대신)

```typescript
// ✅ Good
export const probService = {
  getProbBooks: async (filter) => { ... },
  createProbBook: async (data) => { ... },
};

// ❌ Avoid
export class ProbService {
  async getProbBooks() { ... }
}
```

### 3. Redis/Cache 전략

```typescript
// 1) 읽기: Cache 우선 → DB Fallback
async getBalance(walletId: string): Promise<string> {
  const cached = await cache.get(CacheKeys.walletBalance(walletId));
  if (cached) return cached;

  const wallet = await db.query.CreditWalletTable.findFirst(...);
  await cache.set(CacheKeys.walletBalance(walletId), wallet.balance, TTL);
  return wallet.balance;
}

// 2) 쓰기: DB 메인 → Cache 갱신
async deductCredit(...) {
  const result = await db.transaction(...);
  await cache.set(CacheKeys.walletBalance(walletId), newBalance, TTL); // 갱신
  return result;
}
```

### 4. 트랜잭션 & 동시성

**낙관적 락** (빈번한 업데이트)

```typescript
// version 필드 사용
await db
  .update(CreditWalletTable)
  .set({ balance: newBalance, version: wallet.version + 1 })
  .where(
    and(
      eq(CreditWalletTable.id, walletId),
      eq(CreditWalletTable.version, wallet.version) // ← 낙관적 락
    )
  );
```

**비관적 락** (충돌 거의 없음)

```typescript
const [wallet] = await tx.execute(sql`
  SELECT * FROM credit_wallet WHERE id = ${walletId} FOR UPDATE
`);
```

### 5. 멱등성 보장

```typescript
const idempotencyKey = `user-${userId}-action-${timestamp}`;

// 1) Redis 빠른 체크
const cached = await cache.get(CacheKeys.idempotency(idempotencyKey));
if (cached) return JSON.parse(cached);

// 2) DB 작업
const result = await db.transaction(...);

// 3) Redis + DB 이중 저장
await cache.set(CacheKeys.idempotency(idempotencyKey), result, 86400);
await db.insert(IdempotencyKeysTable).values({ key: idempotencyKey, ... });
```

## 🛠️ Commands

```bash
# 개발
pnpm check-types     # 타입 체크
pnpm test            # 테스트 실행
pnpm test:watch      # 테스트 watch 모드

# DB
pnpm db:generate     # 마이그레이션 파일 생성
pnpm db:push         # 스키마 푸시 (dev)
pnpm db:migrate      # 마이그레이션 실행 (prod)
pnpm db:seed         # 샘플 데이터 생성
pnpm db:studio       # Drizzle Studio 실행

# 코드 품질
pnpm lint            # Biome 린트
```

## 🧪 Testing

```typescript
// Vitest + Mock 패턴
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@workspace/cache", () => ({
  createCache: vi.fn(() => mockCache),
}));

vi.mock("../db", () => ({
  pgDb: mockDb,
}));

// 테스트 작성...
```

## 📊 DB Schema Highlights

### Payment 스키마 특징

1. **비정규화 패턴** (`UsageEventsTable`)

   - `priceId` 있지만 `provider`, `model`, `vendorCostUsd` 중복 저장
   - 이유: JOIN 없이 빠른 리포팅 + 히스토리 보존

2. **Optimistic Locking** (`CreditWalletTable.version`)

   - 동시 차감 시 충돌 감지 + 재시도

3. **멱등성 키** (Redis + DB 이중화)
   - Redis: 빠른 체크 (TTL 24시간)
   - DB: 영구 보관 + Redis 장애 대비

## 🔗 Dependencies

- `@service/auth`: User 인증 (Owner 참조)
- `@workspace/cache`: Redis/Memory 캐시 추상화
- `@workspace/util`: 공통 유틸리티
- `drizzle-orm`: Type-safe ORM
- `zod`: Schema validation
