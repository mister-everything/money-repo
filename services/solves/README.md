# Problem Service

## 개요

문제집과 문제(Problem)를 관리하는 서비스 패키지입니다. Drizzle ORM 기반으로 데이터베이스를 다루고, 다양한 문제 유형을 `blocks` 모듈로 정의하여 재사용합니다.

```bash
# 의존성 설치
pnpm install


# DB 마이그레이션 및 시드
pnpm -F @service/solves db:migrate
pnpm -F @service/solves db:seed
```

## 디렉터리 구성

- `src/prob/blocks.ts` : 지원하는 문제 블록 유형 정의 (주관식, 객관식, O/X 등)
- `src/prob/create-block.ts` : 블록 스키마/체커를 선언적으로 생성하는 빌더
- `src/prob/mock-data.ts` : 샘플 문제 데이터
- `src/prob/prob.service.ts` : 문제집/문제 CRUD 서비스 로직
- `src/prob/types.ts` : 문제집과 문제에 대한 타입 및 생성 스키마
- `src/prob/utils.ts` : 공통 유틸(타입 가드, 파서, 정답 검증 등)
- `src/schema.ts` : Drizzle ORM 스키마 정의
- `src/seed.ts` : 테스트용 시드 스크립트

## 문제 블록 구조

각 문제는 세 가지 구성 요소로 이루어집니다.

1. **content** – 문제 본문이나 선택지 등 사용자에게 보여줄 내용
2. **answer** – 정답 데이터 (문제집 생성 시 저장)
3. **answerSubmit** – 사용자가 제출한 답안을 검증하기 위한 입력 스키마

`create-block.ts`의 `blockBuilder`를 통해 각 블록의 스키마와 정답 체커를 손쉽게 정의할 수 있습니다. 모든 블록은 `contentSchema`, `answerSchema`, `answerSubmitSchema`, `checkAnswer`를 제공하며, `blocks.ts`에서 실제 유형을 등록합니다.

## utils.ts 소개

`src/prob/utils.ts`는 블록 관련 공통 기능을 모아둔 파일로 다음 기능을 제공합니다.

- **타입 가드**
  - `isContent`, `isAnswer`, `isAnswerSubmit` : 블록 타입별로 content/answer/answerSubmit 형태인지 런타임에 판별합니다.
- **파서**
  - `parseContent`, `parseAnswer`, `parseAnswerSubmit` : 블록의 타입을 확인하고 해당 스키마로 파싱하여, 잘못된 데이터는 즉시 예외를 발생시킵니다.
- **통합 스키마**
  - `allContentSchemas`, `allAnswerSchemas`, `allAnswerSubmitSchemas` : 모든 블록 유형을 통합한 Zod 스키마로, create 시 입력값 유효성 검증에 사용됩니다.
- **정답 검증**
  - `checkAnswer(correctAnswer, submittedAnswer)` : 동일 타입인지 확인하고 각 블록의 `checkAnswer`를 호출해 정답 여부를 판단합니다.

이 유틸들을 활용하면 문제집 생성/검증 로직에서 타입 안정성과 공통 검증을 일관되게 유지할 수 있습니다.
