ALTER TABLE "solves"."work_book_submits" ADD COLUMN IF NOT EXISTS "block_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "solves"."work_book_submits" ADD COLUMN IF NOT EXISTS "correct_blocks" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "solves"."work_book_submits" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT false NOT NULL;