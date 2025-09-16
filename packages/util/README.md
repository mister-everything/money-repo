# @workspace/util

범용 유틸리티 함수 모음으로, 클라이언트와 서버 환경 모두에서 사용할 수 있는 순수 함수들로 구성되어 있습니다.

## 📋 개요

이 패키지는 모노레포 내에서 공통으로 사용되는 유틸리티 함수들을 제공합니다. 모든 함수는 순수 함수로 작성되어 있어 클라이언트(브라우저)와 서버(Node.js) 환경 모두에서 안전하게 사용할 수 있습니다.

## 🚀 시작하기

### 설치

이 패키지는 모노레포 내부 패키지이므로 별도 설치가 필요하지 않습니다.

```typescript
import { equal, TIME, createDebounce } from "@workspace/util";
import { IS_PROD, IS_BROWSER } from "@workspace/util/const";
```

## 📦 패키지 구조

```
src/
├── index.ts          # 메인 export 파일
├── base/             # 핵심 유틸리티 함수들
│   ├── equal.ts      # 깊은 객체 비교 함수
│   ├── timestamp.ts  # 시간 관련 유틸리티
│   └── util.ts       # 범용 유틸리티 함수들
└── const/            # 상수 정의
    └── index.ts      # 환경 및 플랫폼 상수
```

## 🔧 주요 기능

### 1. 객체 비교 (`equal`)

깊은 객체 비교를 수행하는 함수입니다.

```typescript
import equal from "@workspace/util";

// 기본 타입 비교
equal(1, 1); // true
equal("hello", "hello"); // true
equal(NaN, NaN); // true

// 배열 비교
equal([1, 2, 3], [1, 2, 3]); // true
equal([1, [2, 3]], [1, [2, 3]]); // true

// 객체 비교
equal({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } }); // true

// 특수 객체 타입 지원
equal(new Date("2023-01-01"), new Date("2023-01-01")); // true
equal(/test/gi, /test/gi); // true
equal(new Map([["a", 1]]), new Map([["a", 1]])); // true
equal(new Set([1, 2, 3]), new Set([1, 2, 3])); // true
```

### 2. 시간 유틸리티 (`TIME`)

시간 단위 변환을 위한 유틸리티입니다.

```typescript
import { TIME } from "@workspace/util";

// 밀리초로 변환
TIME.SECONDS(5); // 5000 (5초)
TIME.MINUTES(2); // 120000 (2분)
TIME.HOURS(1); // 3600000 (1시간)
TIME.DAYS(3); // 259200000 (3일)
TIME.WEEKS(1); // 604800000 (1주)
TIME.YEARS(1); // 31536000000 (1년)

// 밀리초에서 단위로 변환
TIME.SECONDS.FROM(5000); // 5
TIME.MINUTES.FROM(120000); // 2
TIME.HOURS.FROM(3600000); // 1
```

### 3. 범용 유틸리티 함수들

#### 타입 체크 함수

```typescript
import {
  isString,
  isFunction,
  isObject,
  isNull,
  isPromiseLike,
  isJson,
} from "@workspace/util";

isString("hello"); // true
isFunction(() => {}); // true
isObject({}); // true
isNull(null); // true
isNull(undefined); // true
isPromiseLike(Promise.resolve()); // true
isJson('{"a": 1}'); // true
isJson({ a: 1 }); // true
```

#### 비동기 제어 함수

```typescript
import { wait, nextTick, withTimeout, PromiseChain } from "@workspace/util";

// 지연 실행
await wait(1000); // 1초 대기

// 다음 틱까지 대기
await nextTick();

// 타임아웃과 함께 Promise 실행
const result = await withTimeout(fetch("/api"), 5000);

// 순차적 Promise 실행
const chain = PromiseChain();
chain(() => fetch("/api1"));
chain(() => fetch("/api2")); // api1 완료 후 실행
```

#### 디바운스/스로틀

```typescript
import { createDebounce, createThrottle } from "@workspace/util";

// 디바운스
const debounce = createDebounce();
debounce(() => console.log("실행"), 300); // 300ms 후 실행
debounce.clear(); // 취소

// 스로틀
const throttle = createThrottle();
throttle(() => console.log("실행"), 200); // 200ms 간격으로 실행
throttle.clear(); // 취소
```

#### 락 메커니즘

```typescript
import { Locker } from "@workspace/util";

const locker = new Locker();

// 락 설정
locker.lock();
console.log(locker.isLocked); // true

// 락 해제
locker.unlock();
console.log(locker.isLocked); // false

// 락 해제까지 대기
await locker.wait();
```

#### 데이터 처리 함수

```typescript
import { groupBy, deduplicateByKey, objectFlow } from "@workspace/util";

// 그룹화
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 30 },
  { name: "Charlie", age: 25 },
];
const grouped = groupBy(users, "age");
// { "25": [{ name: "Alice", age: 25 }, { name: "Charlie", age: 25 }], "30": [{ name: "Bob", age: 30 }] }

// 중복 제거
const items = [
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 1, name: "C" },
];
const unique = deduplicateByKey(items, "id");
// [{ id: 1, name: "A" }, { id: 2, name: "B" }]

// 객체 플로우
const obj = { a: 1, b: 2, c: 3 };
const result = objectFlow(obj)
  .map((value) => value * 2)
  .filter((value) => value > 3);
// { b: 4, c: 6 }
```

#### 문자열 유틸리티

```typescript
import { capitalizeFirstLetter, truncateString } from "@workspace/util";

capitalizeFirstLetter("hello"); // "Hello"
truncateString("This is a long string", 10); // "This is a..."
```

#### 기타 유틸리티

```typescript
import {
  createIncrement,
  noop,
  randomRange,
  generateUUID,
  errorToString,
  exclude,
  createEmitter,
} from "@workspace/util";

// 카운터 생성
const counter = createIncrement(0);
counter(); // 0
counter(); // 1
counter(); // 2

// 빈 함수
noop(); // 아무것도 하지 않음

// 랜덤 범위
randomRange(1, 10); // 1~10 사이의 랜덤 정수

// UUID 생성
generateUUID(); // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

// 에러를 문자열로 변환
errorToString(new Error("Something went wrong")); // "Something went wrong"
errorToString("Simple string"); // "Simple string"

// 객체에서 특정 키 제외
exclude({ a: 1, b: 2, c: 3 }, ["b"]); // { a: 1, c: 3 }

// 이벤트 에미터
const emitter = createEmitter();
const unsubscribe = emitter.on((value) => console.log(value));
emitter.emit("Hello"); // "Hello" 출력
unsubscribe();
```

### 4. 환경 상수 (`const`)

```typescript
import { IS_PROD, IS_BROWSER, IS_VERCEL_ENV } from "@workspace/util/const";

if (IS_PROD) {
  // 프로덕션 환경에서만 실행
}

if (IS_BROWSER) {
  // 브라우저 환경에서만 실행
  console.log("브라우저에서 실행 중");
}

if (IS_VERCEL_ENV) {
  // Vercel 환경에서만 실행
}
```

## 🎯 사용 가이드라인

### 클라이언트/서버 호환성

이 패키지의 모든 함수는 다음 원칙을 따릅니다:

- ✅ **순수 함수**: 외부 의존성 없이 동작
- ✅ **플랫폼 독립적**: Node.js와 브라우저 모두에서 동작
- ✅ **타입 안전**: TypeScript로 작성되어 타입 체크 지원
- ❌ **Node.js 전용 API 사용 금지**: `fs`, `path`, `crypto` 등
- ❌ **브라우저 전용 API 사용 금지**: `window`, `document`, `localStorage` 등

### 성능 고려사항

- `equal` 함수는 깊은 비교를 수행하므로 큰 객체에 대해서는 성능을 고려해야 합니다
- `createDebounce`와 `createThrottle`은 메모리 누수를 방지하기 위해 적절히 정리해야 합니다
- `PromiseChain`은 순차 실행이 필요한 경우에만 사용하세요

## 🧪 테스트

```bash
# 테스트 실행
pnpm test

# 테스트 감시 모드
pnpm test:watch

# 타입 체크
pnpm check-types

# 린트
pnpm lint
```

## 📚 관련 문서

- [TypeScript 공식 문서](https://www.typescriptlang.org/)
- [Vitest 테스트 프레임워크](https://vitest.dev/)
- [Biome 린터](https://biomejs.dev/)

## 🤝 기여하기

새로운 유틸리티 함수를 추가할 때는 다음 사항을 확인해주세요:

1. **클라이언트/서버 호환성**: Node.js와 브라우저 모두에서 동작해야 합니다
2. **순수 함수**: 외부 의존성 없이 동작해야 합니다
3. **타입 안전성**: TypeScript 타입이 올바르게 정의되어야 합니다
4. **테스트 작성**: 새로운 함수에 대한 테스트를 작성해야 합니다
5. **문서화**: README에 사용 예시를 추가해야 합니다
