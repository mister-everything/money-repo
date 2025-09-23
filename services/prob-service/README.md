# Prob Service

문제집과 문제 블록을 관리하는 서비스입니다.

## 기능

- 문제집(ProbBook) CRUD 작업
- 복합 미디어 문제 블록 지원 (텍스트, 이미지, 비디오, 오디오, 혼합)
- 객관식/주관식 문제 유형 지원
- 태그 기반 분류
- 소유자별 문제집 관리

## 타입 구조

### ProbBook (문제집)

- `id`: 문제집 고유 ID
- `ownerId`: 소유자 ID
- `title`: 제목
- `description`: 설명 (선택사항)
- `blocks`: 문제 블록 배열
- `tags`: 태그 배열 (선택사항)
- `createdAt`: 생성 시간
- `updatedAt`: 수정 시간

### ProbBlock (문제 블록)

- `id`: 문제 블록 ID
- `style`: 문제 스타일 (`generalFormat` | `mixedFormat`)
- `content`: 문제 내용 (다양한 미디어 타입 지원)
- `answerMeta`: 정답 메타데이터 (객관식/주관식)
- `options`: 선택지 배열 (선택사항)
- `title`: 문제 제목 (선택사항)
- `tags`: 태그 배열 (선택사항)

### 지원하는 컨텐츠 타입

- `text`: 텍스트 데이터
- `image`: 이미지 데이터 (URL 포함)
- `video`: 비디오 데이터 (URL, 재생시간 포함)
- `audio`: 오디오 데이터 (URL, 재생시간 포함)
- `mixed`: 여러 리소스 혼합

### 정답 유형

- **객관식** (`ObjectiveAnswerMeta`)
  - `multiple`: 복수 선택 여부
  - `randomized`: 랜덤 정답 여부
- **주관식** (`SubjectiveAnswerMeta`)
  - `charLimit`: 최대 글자 수
  - `lines`: 최대 줄 수
  - `placeholder`: 입력 플레이스홀더

## 사용법

```typescript
import { probService, ProbBook, ProbBlock } from "@service/prob-service";

// 모든 문제집 조회
const probBooks = await probService.findAll();

// ID로 문제집 조회
const probBook = await probService.findById("prob-book-id");

// 소유자별 문제집 조회
const userProbBooks = await probService.findByOwnerId("user-id");

// 문제집 저장/업데이트
const newProbBook = await probService.save({
  id: "new-prob-book",
  ownerId: "user-id",
  title: "수학 문제집",
  description: "중학교 2학년 수학",
  blocks: [
    {
      id: "block-1",
      style: "generalFormat",
      content: {
        id: "content-1",
        type: "text",
        data: { content: "다음 중 가장 큰 수는?" },
      },
      answerMeta: {
        kind: "objective",
        multiple: false,
      },
      options: [
        {
          id: "option-1",
          type: "text",
          data: { content: "1. 0.5" },
        },
        {
          id: "option-2",
          type: "text",
          data: { content: "2. 0.75" },
        },
      ],
    },
  ],
  tags: ["수학", "중등"],
});

// 문제집 삭제
await probService.deleteById("prob-book-id");
```

## 데이터베이스 마이그레이션

```bash
# 마이그레이션 파일 생성
pnpm db:generate

# 마이그레이션 실행
pnpm db:migrate

# 데이터베이스 리셋
pnpm db:reset
```

## 스크립트

- `pnpm lint`: 코드 린팅
- `pnpm check-types`: 타입 검사
- `pnpm db:generate`: 마이그레이션 파일 생성
- `pnpm db:push`: 스키마를 데이터베이스에 푸시
- `pnpm db:studio`: Drizzle Studio 실행
- `pnpm db:migrate`: 마이그레이션 실행
- `pnpm db:reset`: 데이터베이스 리셋
