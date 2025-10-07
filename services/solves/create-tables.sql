-- solves 스키마 생성
CREATE SCHEMA IF NOT EXISTS solves;

-- 태그 테이블
CREATE TABLE IF NOT EXISTS solves.tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 문제집 테이블
CREATE TABLE IF NOT EXISTS solves.prob_books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false NOT NULL,
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 문제 블록 테이블
CREATE TABLE IF NOT EXISTS solves.prob_blocks (
  id SERIAL PRIMARY KEY,
  prob_book_id INTEGER NOT NULL,
  "order" INTEGER DEFAULT 0 NOT NULL,
  type TEXT NOT NULL,
  question TEXT,
  content JSONB NOT NULL,
  answer JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY (prob_book_id) REFERENCES solves.prob_books(id) ON DELETE CASCADE
);

-- 문제집 제출 세션 테이블
CREATE TABLE IF NOT EXISTS solves.prob_book_submits (
  id SERIAL PRIMARY KEY,
  prob_book_id INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0 NOT NULL,
  score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY (prob_book_id) REFERENCES solves.prob_books(id) ON DELETE CASCADE
);

-- 문제 답안 제출 테이블
CREATE TABLE IF NOT EXISTS solves.prob_block_answer_submits (
  block_id INTEGER NOT NULL,
  submit_id INTEGER NOT NULL,
  answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (block_id, submit_id),
  FOREIGN KEY (block_id) REFERENCES solves.prob_blocks(id) ON DELETE CASCADE,
  FOREIGN KEY (submit_id) REFERENCES solves.prob_book_submits(id) ON DELETE CASCADE
);

-- 문제집-태그 연결 테이블
CREATE TABLE IF NOT EXISTS solves.prob_book_tags (
  prob_book_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (prob_book_id, tag_id),
  FOREIGN KEY (prob_book_id) REFERENCES solves.prob_books(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES solves.tags(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_prob_books_owner_id ON solves.prob_books(owner_id);
CREATE INDEX IF NOT EXISTS idx_prob_blocks_prob_book_id ON solves.prob_blocks(prob_book_id);
CREATE INDEX IF NOT EXISTS idx_prob_blocks_type ON solves.prob_blocks(type);
CREATE INDEX IF NOT EXISTS idx_prob_book_submits_owner_id ON solves.prob_book_submits(owner_id);
CREATE INDEX IF NOT EXISTS idx_prob_book_submits_prob_book_id ON solves.prob_book_submits(prob_book_id);
