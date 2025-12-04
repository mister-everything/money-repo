CREATE SCHEMA IF NOT EXISTS "report";
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'notif_type' AND n.nspname = 'report') THEN
CREATE TYPE "report"."notif_type" AS ENUM('REPORT_COMPLETE', 'CONTENT_WARN', 'CONTENT_DELETE', 'SYSTEM_NOTICE');
END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'report_category_detail' AND n.nspname = 'report') THEN
CREATE TYPE "report"."report_category_detail" AS ENUM('ERROR_ANSWER', 'ERROR_TYPO', 'ERROR_EXPLANATION', 'VIOL_GUIDELINE', 'VIOL_COPYRIGHT', 'OTHER_SYSTEM', 'OTHER_FREE');
END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'report_category_main' AND n.nspname = 'report') THEN
CREATE TYPE "report"."report_category_main" AS ENUM('ERROR', 'VIOLATION', 'OTHER');
END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'report_status' AND n.nspname = 'report') THEN
CREATE TYPE "report"."report_status" AS ENUM('RECEIVED', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'report_target_type' AND n.nspname = 'report') THEN
CREATE TYPE "report"."report_target_type" AS ENUM('QUIZBOOK', 'QUIZ_BLOCK', 'OTHER');
END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "report"."content_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"reporter_user_id" text NOT NULL,
	"target_type" "report"."report_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"category_main" "report"."report_category_main" NOT NULL,
	"category_detail" "report"."report_category_detail" NOT NULL,
	"detail_text" text,
	"status" "report"."report_status" DEFAULT 'RECEIVED' NOT NULL,
	"processor_user_id" text,
	"processed_at" timestamp,
	"processing_note" text
);
--> statement-breakpoint

ALTER TABLE "report"."content_reports"
  ADD COLUMN IF NOT EXISTS "category_main" "report"."report_category_main";
--> statement-breakpoint
ALTER TABLE "report"."content_reports"
  ADD COLUMN IF NOT EXISTS "category_detail" "report"."report_category_detail";
--> statement-breakpoint
ALTER TABLE "report"."content_reports"
  ADD COLUMN IF NOT EXISTS "status" "report"."report_status" DEFAULT 'RECEIVED';
--> statement-breakpoint
ALTER TABLE "report"."content_reports"
  ADD COLUMN IF NOT EXISTS "processor_user_id" text;
--> statement-breakpoint
ALTER TABLE "report"."content_reports"
  ADD COLUMN IF NOT EXISTS "processed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "report"."content_reports"
  ADD COLUMN IF NOT EXISTS "processing_note" text;
--> statement-breakpoint
ALTER TABLE "report"."content_reports"
  DROP COLUMN IF EXISTS "category";
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "report"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"notif_type" "report"."notif_type" NOT NULL,
	"related_content_id" text,
	"message_body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "report_unique_user_target_detail" ON "report"."content_reports" USING btree ("reporter_user_id","target_type","target_id","category_detail");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_target_idx" ON "report"."content_reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_status_idx" ON "report"."content_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_category_idx" ON "report"."content_reports" USING btree ("category_main","category_detail");
