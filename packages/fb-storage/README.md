# @workspace/fb-storage

Node.js 파일 시스템 기반의 스토리지 모듈입니다.

## 설치

```bash
pnpm add @workspace/fb-storage
```

## 사용법

### 기본 사용법

```typescript
import { createFbStorage } from "@workspace/fb-storage";

// 스토리지 생성
const storage = createFbStorage("./data.json");

// 데이터 저장
await storage.save({ name: "John", age: 30, active: true });

// 데이터 읽기
const data = await storage.get();
console.log("Loaded data:", data);

// 파일 존재 확인
const exists = await storage.exists();
console.log("File exists:", exists);

// 파일 삭제
await storage.delete();
```

### 타입 지정 사용

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const userStorage = createFbStorage<User>("./user.json");
await userStorage.save({
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
});
```

### 배열 데이터

```typescript
const listStorage = createFbStorage<string[]>("./list.json");
await listStorage.save(["apple", "banana", "cherry"]);
```

### 옵션 사용

```typescript
const configStorage = createFbStorage("./config.json", {
  indent: 4, // 4칸 들여쓰기
  createDir: true, // 디렉토리 자동 생성
});

await configStorage.save({
  version: "1.0.0",
  features: {
    authentication: true,
    analytics: false,
  },
});
```

## API

### `createFbStorage<T>(filePath: string, options?: Options)`

파일 스토리지 인스턴스를 생성합니다.

**Parameters:**

- `filePath` - 저장할 data 파일 경로
- `options` - 선택적 설정 옵션

**Returns:** 스토리지 인스턴스

### 스토리지 메서드

- `save(data: T)` - 데이터를 파일로 저장
- `get()` - 파일에서 데이터 읽기
- `exists()` - 파일 존재 여부 확인
- `delete()` - 파일 삭제
