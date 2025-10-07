-- 기존 테이블들 삭제 (역순으로 삭제)
DROP TABLE IF EXISTS "solves"."prob_options";
DROP TABLE IF EXISTS "solves"."prob_contents";
DROP TABLE IF EXISTS "solves"."prob_answer_meta";
DROP TABLE IF EXISTS "solves"."prob_tags";
DROP TABLE IF EXISTS "solves"."probs";
DROP TABLE IF EXISTS "solves"."prob_book_tags";

-- 새로운 테이블들 생성

-- 문제집 테이블
CREATE TABLE IF NOT EXISTS "solves"."prob_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"thumbnail" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 문제 블록 테이블
CREATE TABLE IF NOT EXISTS "solves"."prob_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"prob_book_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"question" text,
	"content" jsonb NOT NULL,
	"answer" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 문제집 제출 세션 테이블
CREATE TABLE IF NOT EXISTS "solves"."prob_book_submits" (
	"id" serial PRIMARY KEY NOT NULL,
	"prob_book_id" integer NOT NULL,
	"owner_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"total_questions" integer NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 문제 답안 제출 테이블
CREATE TABLE IF NOT EXISTS "solves"."prob_block_answer_submits" (
	"block_id" integer NOT NULL,
	"submit_id" integer NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prob_block_answer_submits_block_id_submit_id_pk" PRIMARY KEY("block_id","submit_id")
);

-- 태그 테이블 (기존과 동일)
-- CREATE TABLE IF NOT EXISTS "solves"."tags" (
--	"id" serial PRIMARY KEY NOT NULL,
--	"name" text NOT NULL,
--	"created_at" timestamp DEFAULT now() NOT NULL,
--	CONSTRAINT "tags_name_unique" UNIQUE("name")
-- );

-- 문제집-태그 연결 테이블
CREATE TABLE IF NOT EXISTS "solves"."prob_book_tags" (
	"prob_book_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "prob_book_tags_prob_book_id_tag_id_pk" PRIMARY KEY("prob_book_id","tag_id")
);

-- 외래 키 제약조건 추가
DO $$ BEGIN
	ALTER TABLE "solves"."prob_books" ADD CONSTRAINT "prob_books_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_blocks" ADD CONSTRAINT "prob_blocks_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_book_submits" ADD CONSTRAINT "prob_book_submits_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_book_submits" ADD CONSTRAINT "prob_book_submits_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_block_answer_submits" ADD CONSTRAINT "prob_block_answer_submits_block_id_prob_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "solves"."prob_blocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_block_answer_submits" ADD CONSTRAINT "prob_block_answer_submits_submit_id_prob_book_submits_id_fk" FOREIGN KEY ("submit_id") REFERENCES "solves"."prob_book_submits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_book_tags" ADD CONSTRAINT "prob_book_tags_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "solves"."prob_book_tags" ADD CONSTRAINT "prob_book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "solves"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
