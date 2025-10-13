# 구독 시스템 (Subscription System)

## 개요

AI Chatbot 서비스를 위한 **단순화된 구독 시스템**입니다.

### 핵심 특징

- **지갑 1개**: 기존 크레딧 시스템 그대로 활용
- **구독 = 정기 충전**: 매월 크레딧 자동 충전
- **이월 옵션**: 플랜별로 설정 (rolloverEnabled)
- **자동 정기 충전**: 잔액 부족 시 자동 충전
- **완전 호환**: 기존 paymentService와 100% 호환

## 아키텍처

```
User
  └── Subscription (1개)
       ├── Plan (Free/Pro/Business)
       └── Wallet (1개, 기존 CreditWallet)
            ├── 구독 크레딧
            └── 추가 구매 크레딧 (모두 한 지갑에!)
```

### 데이터베이스 스키마

1. **subscription_plans**: 플랜 정의

   - monthlyQuota: 월간 크레딧
   - refillAmount: 정기 충전량
   - refillIntervalHours: 충전 간격 (시간)
   - maxRefillBalance: 최대 누적 잔액
   - **rolloverEnabled**: 이월 여부 (NEW!)

2. **user_subscriptions**: 사용자 구독 정보

   - walletId: 지갑 (1개만!)
   - currentPeriodStart/End: 현재 구독 기간

3. **subscription_refills**: 정기 충전 이력

## 플랜 구성

### Free Plan

- 월 구독료: $0
- 월간 크레딧: 1,000
- 정기 충전: 50 / 6시간
- 최대 누적: 200
- **이월 여부: 불가 (매월 리셋)**

### Pro Plan

- 월 구독료: $100
- 월간 크레딧: 10,000
- 정기 충전: 500 / 6시간
- 최대 누적: 2,000
- **이월 여부: 가능 (누적)**

### Business Plan

- 월 구독료: $500
- 월간 크레딧: 100,000
- 정기 충전: 5,000 / 6시간
- 최대 누적: 20,000
- **이월 여부: 가능 (누적)**

## 주요 서비스

### subscriptionService

```typescript
// 구독 생성 (지갑 1개만 생성)
await subscriptionService.createSubscription(userId, planId);
// → { subscriptionId, walletId, initialCredits }

// 구독 조회
const subscription = await subscriptionService.getActiveSubscription(userId);

// 구독 갱신 (매월 자동, rollover 옵션 적용)
await subscriptionService.renewSubscription(subscriptionId);

// 정기 충전 체크 (자동)
await subscriptionService.checkAndRefillCredits(userId);

// 구독 취소
await subscriptionService.cancelSubscription(subscriptionId);

// 플랜 변경
await subscriptionService.upgradeSubscription(userId, newPlanId);
```

### 기존 paymentService 그대로 사용

```typescript
// 잔액 조회 (기존과 동일!)
const balance = await paymentService.getBalance(walletId);

// 크레딧 차감 (기존과 동일!)
const usage = await paymentService.deductCredit({
  walletId,
  userId,
  provider: "openai",
  model: "gpt-4o-mini",
  inputTokens: 1000,
  outputTokens: 500,
  idempotencyKey: "unique-key",
});

// ⭐ 새로운 방법: 자동 리필 포함 차감 (권장!)
try {
  const result = await paymentService.deductCreditWithAutoRefill({
    walletId,
    userId,
    provider: "openai",
    model: "gpt-4o-mini",
    inputTokens: 1000,
    outputTokens: 500,
    idempotencyKey: "unique-key",
  });

  if (result.autoRefilled) {
    console.log(`자동 충전: ${result.refillAmount}`);
  }
  console.log(`남은 잔액: ${result.remainingBalance}`);
} catch (error) {
  if (error.name === "InsufficientCreditsError") {
    const info = JSON.parse(error.message);
    // info.nextRefillAt: 다음 충전 시각
    // info.suggestions: 사용자에게 제안할 액션
  }
}

// 추가 구매 (기존과 동일!)
await paymentService.creditPurchase({
  walletId,
  userId,
  creditAmount: 5000,
  invoiceId,
  idempotencyKey,
});
```

## 사용 흐름

### 1. 초기 설정

```bash
# 플랜 시드 데이터 생성
pnpm seed
# → Subscription (구독 플랜) 선택
```

### 2. 구독 생성

```typescript
import { subscriptionService } from "@service/solves";

// Free 플랜으로 구독 시작
const freePlan = await subscriptionService.getPlanByName("free");
const result = await subscriptionService.createSubscription(
  userId,
  freePlan.id
);

console.log(result);
// {
//   success: true,
//   subscriptionId: "...",
//   walletId: "...",           // 지갑 1개만!
//   initialCredits: "1000.000000"
// }
```

### 3. API 사용 (자동 리필 포함 - 권장)

```typescript
import { paymentService, subscriptionService } from "@service/solves";

// 지갑 조회 (간편 헬퍼)
const walletId = await subscriptionService.getWalletId(userId);

if (!walletId) {
  throw new Error("구독하거나 크레딧을 구매해주세요");
}

// ⭐ 자동 리필 포함 차감 (권장!)
try {
  const result = await paymentService.deductCreditWithAutoRefill({
    walletId,
    userId,
    provider: "openai",
    model: "gpt-4o-mini",
    inputTokens: 1000,
    outputTokens: 500,
    idempotencyKey: `req_${Date.now()}`,
  });

  console.log(result);
  // {
  //   success: true,
  //   usageId: "...",
  //   autoRefilled: true,         // 자동 충전 여부
  //   refillAmount: "500.000000", // 충전량 (있을 경우)
  //   remainingBalance: "9850"    // 남은 잔액
  // }
} catch (error) {
  if (error.name === "InsufficientCreditsError") {
    const info = JSON.parse(error.message);

    console.error("크레딧 부족!");
    console.error(`현재: ${info.currentBalance} / 필요: ${info.required}`);

    if (info.nextRefillAt) {
      console.log(`다음 충전: ${info.nextRefillAt}`);
      console.log(`충전 금액: ${info.nextRefillAmount}`);
      console.log(`대기 시간: ${info.waitTimeMinutes}분`);
    }

    // 사용자에게 제안
    for (const suggestion of info.suggestions) {
      console.log(`- ${suggestion.message}`);
    }
  }
}
```

### 3-1. 기존 방식 (호환성 유지)

```typescript
// 구독 조회
const subscription = await subscriptionService.getActiveSubscription(userId);

// 기존 방식 그대로 사용!
const usage = await paymentService.deductCredit({
  walletId: subscription.walletId,
  userId,
  provider: "openai",
  model: "gpt-4o-mini",
  inputTokens: 1000,
  outputTokens: 500,
  idempotencyKey: `req_${Date.now()}`,
});

console.log(usage);
// {
//   success: true,
//   usageId: "..."
// }

// 잔액 확인
const balance = await paymentService.getBalance(subscription.walletId);
console.log(`잔액: ${balance} 크레딧`);
```

### 4. 자동 정기 충전

```typescript
// Cron Job (5분마다 실행 권장)
import { subscriptionService } from "@service/solves";

const result = await subscriptionService.checkAndRefillCredits(userId);

if (result.refilled) {
  console.log(`충전됨: ${result.refillAmount}`);
  console.log(`새 잔액: ${result.newBalance}`);
  console.log(`다음 충전: ${result.nextRefillAt}`);
}
```

### 5. 월간 갱신 (이월 옵션 적용!)

```typescript
// Cron Job (매일 실행 권장)
import { subscriptionService } from "@service/solves";

// 개별 갱신
await subscriptionService.renewSubscription(subscriptionId);
// → rolloverEnabled=true: 기존 잔액 + 새 크레딧
// → rolloverEnabled=false: 기존 잔액 리셋 + 새 크레딧

// 만료 처리
const expiredCount = await subscriptionService.expireSubscriptions();
console.log(`만료 처리: ${expiredCount}건`);
```

### 6. 플랜 변경

```typescript
import { subscriptionService } from "@service/solves";

// Pro 플랜으로 업그레이드
const proPlan = await subscriptionService.getPlanByName("pro");
const result = await subscriptionService.upgradeSubscription(
  userId,
  proPlan.id
);

console.log(result);
// {
//   success: true,
//   subscriptionId: "...",
//   newPlanId: "...",
//   creditAdjustment: "+4500.000000",  // Pro-rate 조정
//   newBalance: "14500.000000"
// }
```

## 월간 갱신 로직 (rolloverEnabled)

```
1. 구독 갱신일 체크
2. 플랜의 rolloverEnabled 확인

if rolloverEnabled == true (Pro/Business):
  ✅ 기존 잔액 유지
  ✅ 새 크레딧 추가
  newBalance = 기존 + monthlyQuota

else (Free):
  ❌ 기존 잔액 리셋 (소멸)
  ✅ 새 크레딧 지급
  newBalance = monthlyQuota

3. 구독 기간 +1개월
```

### 예시:

**Pro Plan (이월 가능)**

```
2024-01: 10,000 지급 → 3,000 사용 → 7,000 남음
2024-02: 10,000 추가 → 17,000 총 잔액
2024-03: 10,000 추가 → 27,000 총 잔액 (계속 누적)
```

**Free Plan (이월 불가)**

```
2024-01: 1,000 지급 → 200 사용 → 800 남음
2024-02: 800 리셋 (소멸) → 1,000 새로 지급 → 1,000 총 잔액
2024-03: 1,000 리셋 → 1,000 새로 지급 (매월 동일)
```

## 정기 충전 로직

```
1. 마지막 충전 시각 + 충전 간격 확인
2. 현재 시각이 다음 충전 시각을 지났는가?
   ├─ No → 스킵
   └─ Yes → 다음 단계
3. 현재 잔액 < maxRefillBalance ?
   ├─ No → 스킵 (충분히 누적됨)
   └─ Yes → 충전 실행
4. 잔액 += refillAmount
5. lastRefillAt 업데이트
```

## 캐싱 전략

- **구독 정보**: 10분 (자주 변경되지 않음)
- **플랜 정보**: 1시간 (거의 변경 안됨)
- **잔액**: 기존 paymentService와 동일 (10분)
- **정기 충전 잠금**: 1분 (중복 방지)

## 트랜잭션 종류

- `subscription_grant`: 구독 시작/갱신 시 크레딧 지급
- `subscription_refill`: 정기 자동 충전
- `subscription_reset`: 월간 갱신 시 잔액 리셋 (rollover=false)
- `debit`: 사용 차감 (기존)
- `purchase`: 추가 구매 (기존)

## 관리자 기능

### 플랜 생성

```typescript
import { pgDb } from "../db";
import { SubscriptionPlansTable } from "./schema";

await pgDb.insert(SubscriptionPlansTable).values({
  name: "enterprise",
  displayName: "Enterprise Plan",
  priceUsd: "1000000.000000",
  monthlyQuota: "1000000.000000",
  refillAmount: "50000.000000",
  refillIntervalHours: 6,
  maxRefillBalance: "200000.000000",
  rolloverEnabled: true,
  isActive: true,
});
```

## Cron Job 예시

```typescript
// cron/subscription-jobs.ts
import cron from "node-cron";
import { subscriptionService } from "@service/solves";

// 매일 자정에 만료 체크
cron.schedule("0 0 * * *", async () => {
  const count = await subscriptionService.expireSubscriptions();
  console.log(`[Cron] 만료 처리: ${count}건`);
});

// 5분마다 정기 충전 체크
cron.schedule("*/5 * * * *", async () => {
  const activeUsers = await getActiveUserIds();

  for (const userId of activeUsers) {
    try {
      await subscriptionService.checkAndRefillCredits(userId);
    } catch (err) {
      console.error(`[Cron] 충전 실패 (${userId}):`, err);
    }
  }
});
```

## 기존 시스템과의 호환성

### ✅ 완전 호환

- `paymentService.getBalance()` 그대로 사용
- `paymentService.deductCredit()` 그대로 사용
- `paymentService.creditPurchase()` 그대로 사용
- `CreditWallet` 테이블 그대로 활용
- `CreditLedger` 원장 그대로 활용

### ✅ 추가된 것

- `subscriptionService`: 구독 관리만 추가
- `SubscriptionPlansTable`: 플랜 정의
- `UserSubscriptionsTable`: 구독 메타데이터

### ❌ 제거된 것

- 없음! (기존 시스템 모두 유지)

## 테스트

```bash
# 단위 테스트 실행
pnpm test services/solves/src/payment/subscription.service.test.ts
```

## 다음 단계

### 결제 게이트웨이 연동

- Stripe, Toss Payments 등 PG 연동
- 구독 결제 자동화
- Webhook 처리

### API 엔드포인트 추가

- `POST /api/subscriptions` - 구독 생성
- `GET /api/subscriptions/me` - 내 구독 조회
- `POST /api/subscriptions/upgrade` - 플랜 변경
- `DELETE /api/subscriptions` - 구독 취소
- `GET /api/balance` - 잔액 조회

### 관리자 대시보드

- 플랜 관리 UI
- 사용자 구독 현황
- 사용량 통계

## FAQ

**Q: 구독하지 않은 사용자는 어떻게 하나요?**
A: 기존 크레딧 구매 방식(일회성 충전) 그대로 사용 가능합니다.

**Q: 구독자가 추가 크레딧을 구매하면?**
A: 같은 지갑에 추가되어 누적됩니다. 구독 크레딧 + 추가 구매 크레딧 모두 하나의 잔액으로 관리됩니다.

**Q: Free 플랜의 이월 불가 정책은 왜?**
A: 무료 사용자의 무제한 누적을 방지하기 위함입니다. Pro/Business는 유료 고객이므로 이월을 허용합니다.

**Q: 기존 크레딧 시스템에서 마이그레이션은?**
A: 100% 호환되므로 마이그레이션 불필요합니다. 기존 사용자는 그대로 사용하고, 새 사용자는 구독으로 시작하면 됩니다.

## 참고 자료

- Vercel Usage-based Pricing
- AWS Billing Model
- Stripe Subscription & Metered Billing
