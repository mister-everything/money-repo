# @service/todo

Example 서비스 패키지로, 모노레포에서 서비스를 패키지로 분리하여 사용하는 방법을 보여줍니다.

## 📋 개요

이 패키지는 PostgreSQL과 Drizzle ORM을 사용하여 Todo 기능을 제공하는 서비스입니다. 별도 빌드 없이 TypeScript 소스 파일을 직접 사용하며, peerDependencies를 통해 의존성을 관리합니다.

## 🚀 시작하기

### 1. PostgreSQL 실행

이 패키지를 사용하기 위해 PostgreSQL이 실행 중이어야 합니다.

```bash
# 모노레포 루트에서 실행
pnpm docker:pg

# 레포 폴더 아무 하위폴더에서
pnpm -w docker:pg
```

### 2. 데이터베이스 스튜디오 실행

```bash
# /service/todo 디렉토리에서 실행
pnpm db:studio

# 레포 아무 하위 폴더 에서
pnpm -F todo db:studio
```

브라우저에서 `https://local.drizzle.studio`으로 접속하여 데이터베이스 스튜디오를 확인할 수 있습니다.

## 🗄️ 데이터베이스 스키마 관리

### 새로운 테이블 추가하기

0. **서비스,스키마 이름정의**

```typescript
// src/const.ts
export const SCHEMA_NAME = "todo";
export const SERVICE_NAME = "todo-service";
```

1. **스키마,테이블 정의**

```typescript
// src/schema.ts
import {
  boolean,
  pgSchema,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { SCHEMA_NAME } from "./const";

export const todoSchema = pgSchema(SCHEMA_NAME);

export const todoTable = todoSchema.table("todo", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

2. **마이그레이션 파일 생성**

```bash
pnpm db:generate
```

- `/migrations/` 디렉토리에 `?.sql` 파일이 생성됩니다
- 실제 데이터 베이스에 테이블을 생성하는 것이 아닌, 테이블 생성 쿼리를 생성 합니다.

3. **마이그레이션 실행**

```bash
   pnpm db:migrate
```

- 생성된 SQL 파일이 실행되어 실제 테이블이 생성됩니다

## 🔧 사용법

### 다른 패키지에서 사용하기

```json
// package.json
 "dependencies": {
    "@service/todo": "workspace:*",
    "drizzle-orm": "^0.44.5",
    "pg": "^8.16.3",
    ...
 }
```

사용할 패키지에 의존성 추가

```typescript
import { todoService, todoSaveSchema, Todo } from "@service/todo";

// Todo 목록 조회
const todos = await todoService.findAll();

// Todo 저장
const newTodo = await todoService.save(
  todoSaveSchema.parse({
    title: "새로운 할일",
    description: "설명",
    done: false,
  })
);
```

## 📝 타입 정의 가이드라인

### `types.ts` 작성 규칙

**✅ 올바른 예시:**

```typescript
import { z } from "zod";

// 순수 타입 정의
export type Todo = {
  id: number;
  title: string;
  done: boolean;
};

// Zod 스키마 정의
export const todoSaveSchema = z.object({
  title: z.string(),
  done: z.boolean(),
});
```

### 이유

- **Next.js 호환성**: Server Side와 Client Side 모두에서 사용 가능
- **번들 크기 최적화**: 불필요한 의존성 제거
- **타입 안정성**: 순수 타입으로 더 안전한 타입 체크

## 🛠️ 새로운 서비스 패키지 생성 가이드

이 예시를 참고하여 새로운 서비스 패키지를 생성할 때 다음 가이드라인을 따르세요:

## 📚 관련 문서

- [Drizzle ORM 공식 문서](https://orm.drizzle.team/)
- [Next.js 서버 컴포넌트](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Zod 스키마 검증](https://zod.dev/)
