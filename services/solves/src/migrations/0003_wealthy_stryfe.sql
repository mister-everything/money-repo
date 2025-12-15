ALTER TABLE "solves"."work_books" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "solves"."work_books" ADD COLUMN IF NOT EXISTS "deleted_reason" text;