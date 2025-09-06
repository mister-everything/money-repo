# @workspace/util

A comprehensive utility library for JavaScript/TypeScript projects with extensive type safety and testing coverage.

## Installation

```bash
pnpm add @workspace/util
```

## Usage

### Base Utilities

```typescript
import {
  wait,
  isString,
  isFunction,
  createDebounce,
  createThrottle,
  groupBy,
  generateUUID,
  capitalizeFirstLetter,
  exclude,
  withTimeout
} from "@workspace/util";

// Async utilities
await wait(1000); // Wait 1 second

// Type checking
isString("hello"); // true
isFunction(() => {}); // true

// Debouncing and throttling
const debounce = createDebounce();
debounce(() => console.log("debounced"), 300);

// Array utilities
const grouped = groupBy(users, "role");

// String utilities
capitalizeFirstLetter("hello"); // "Hello"

// Object utilities
const filtered = exclude(obj, ["password", "secret"]);

// Promise utilities
const result = await withTimeout(promise, 5000);
```

### Deep Equality

```typescript
import equal from "@workspace/util/equal";

equal({ a: 1 }, { a: 1 }); // true
equal([1, 2, 3], [1, 2, 3]); // true
equal(new Date("2023-01-01"), new Date("2023-01-01")); // true
equal(new Map([["a", 1]]), new Map([["a", 1]])); // true
```

### Time Constants

```typescript
import { TIME } from "@workspace/util";

// Convert to milliseconds
const oneMinute = TIME.MINUTES(1); // 60000
const oneHour = TIME.HOURS(1); // 3600000
const oneDay = TIME.DAYS(1); // 86400000

// Convert from milliseconds
const minutes = TIME.MINUTES.FROM(180000); // 3
const hours = TIME.HOURS.FROM(7200000); // 2
```

### Environment Constants

```typescript
import { IS_PROD, IS_BROWSER, IS_VERCEL_ENV } from "@workspace/util/const";

if (IS_PROD) {
  // Production-only code
}

if (IS_BROWSER) {
  // Client-side only code
}

if (IS_VERCEL_ENV) {
  // Vercel-specific configuration
}
```

## Advanced Utilities

### Locker

```typescript
import { Locker } from "@workspace/util";

const locker = new Locker();

async function criticalSection() {
  await locker.wait(); // Wait for unlock
  locker.lock();
  
  try {
    // Critical code here
  } finally {
    locker.unlock();
  }
}
```

### Promise Chain

```typescript
import { PromiseChain } from "@workspace/util";

const chain = PromiseChain();

// Execute promises sequentially
chain(() => fetchUser());
chain(() => updateProfile());
chain(() => sendNotification());
```

### Event Emitter

```typescript
import { createEmitter } from "@workspace/util";

const emitter = createEmitter();

const unsubscribe = emitter.on((message) => {
  console.log("Received:", message);
});

emitter.emit("Hello World!");
unsubscribe(); // Remove listener
```

## Testing

Run tests with:

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

## Features

- ✅ **127 test cases** with comprehensive coverage
- ✅ **Type-safe** utilities with full TypeScript support
- ✅ **Tree-shakeable** exports for optimal bundle size
- ✅ **Zero dependencies** for maximum compatibility
- ✅ **ESM/CJS** compatible module system
- ✅ **Async utilities** with proper error handling
- ✅ **Performance optimized** implementations

## API Reference

### Type Checking
- `isString(value)` - Check if value is string
- `isFunction(value)` - Check if value is function
- `isObject(value)` - Check if value is object
- `isNull(value)` - Check if value is null or undefined
- `isPromiseLike(value)` - Check if value is promise-like
- `isJson(value)` - Check if value is valid JSON

### Async Utilities
- `wait(ms)` - Promise-based delay
- `nextTick()` - Schedule callback for next event loop
- `withTimeout(promise, ms)` - Add timeout to promise
- `PromiseChain()` - Sequential promise execution

### Array/Object Utilities
- `groupBy(array, key)` - Group array elements by key
- `exclude(object, keys)` - Remove keys from object
- `deduplicateByKey(array, key)` - Remove duplicates by key
- `objectFlow(object)` - Functional object operations

### String Utilities
- `capitalizeFirstLetter(str)` - Capitalize first character
- `truncateString(str, length)` - Truncate with ellipsis
- `generateUUID()` - Generate UUID v4

### Control Flow
- `createDebounce()` - Create debounce function
- `createThrottle()` - Create throttle function
- `createIncrement(start)` - Create increment counter
- `noop()` - No-operation function

## License

MIT
