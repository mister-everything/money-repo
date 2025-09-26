# Problem Service Database Schema

## 개요

Problem Service는 정규화된 관계형 데이터베이스 구조로 문제집과 문제를 관리합니다.

## 테이블 구조

### 1. 핵심 테이블

#### prob_books (문제집)

```sql
CREATE TABLE prob_books (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### probs (문제)

```sql
CREATE TABLE probs (
    id TEXT PRIMARY KEY,
    prob_book_id TEXT REFERENCES prob_books(id) ON DELETE CASCADE,
    title TEXT,
    style TEXT NOT NULL, -- "generalFormat" | "mixedFormat"
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### tags (태그)

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 관계 테이블

#### prob_book_tags (문제집-태그)

```sql
CREATE TABLE prob_book_tags (
    prob_book_id TEXT REFERENCES prob_books(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (prob_book_id, tag_id)
);
```

#### prob_tags (문제-태그)

```sql
CREATE TABLE prob_tags (
    prob_id TEXT REFERENCES probs(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (prob_id, tag_id)
);
```

### 3. 문제 세부 테이블

#### prob_answer_meta (정답 메타데이터)

```sql
CREATE TABLE prob_answer_meta (
    prob_id TEXT PRIMARY KEY REFERENCES probs(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, -- "objective" | "subjective"

    -- 객관식 전용
    multiple BOOLEAN,      -- 복수 선택 가능
    randomized BOOLEAN,    -- 선택지 랜덤 배치

    -- 주관식 전용
    char_limit INTEGER,    -- 최대 글자수
    lines INTEGER,         -- 최대 줄수
    placeholder TEXT       -- 입력 힌트
);
```

#### prob_contents (문제 내용)

```sql
CREATE TABLE prob_contents (
    id SERIAL PRIMARY KEY,
    prob_id TEXT REFERENCES probs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,     -- "text" | "image" | "video" | "audio" | "mixed"
    content TEXT NOT NULL,
    url TEXT,               -- 미디어 파일 URL
    duration INTEGER,       -- 비디오/오디오 길이
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### prob_options (문제 선택지)

```sql
CREATE TABLE prob_options (
    id SERIAL PRIMARY KEY,
    prob_id TEXT REFERENCES probs(id) ON DELETE CASCADE,
    type TEXT NOT NULL,        -- "text" | "image" | "video" | "audio"
    content TEXT NOT NULL,
    url TEXT,
    is_correct BOOLEAN DEFAULT false,
    correct_order INTEGER,     -- 복수정답 순서
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 주요 특징

### 정규화된 구조

- JSON 필드 → 관계형 테이블로 전환
- 쿼리 성능 향상 및 데이터 무결성 보장

### 태그 시스템

- 문제집/문제 레벨 태그 지원
- 자동 중복 제거 및 정규화

### CASCADE 삭제

- 문제집 삭제 시 모든 관련 데이터 자동 삭제

### 다양한 미디어 지원

- 텍스트, 이미지, 비디오, 오디오
- Mixed 타입으로 여러 미디어 조합

## 마이그레이션

```bash
# 마이그레이션 실행
pnpm db:migrate

# DB 리셋 (개발용)
pnpm db:reset

# 스키마 재생성
pnpm db:generate
```

## TypeScript 타입

주요 타입들은 `src/types.ts`에서 확인:

- `ProbBook`: 완성된 문제집
- `ProbBookSaveInput`: 저장용 문제집
- `AnswerMeta`: 정답 메타데이터
