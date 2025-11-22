CREATE SCHEMA IF NOT EXISTS "report";
--> statement-breakpoint
CREATE TYPE "report"."report_target_type" AS ENUM('QUIZBOOK', 'QUIZ_BLOCK', 'OTHER');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report"."content_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"reporter_user_id" text NOT NULL,
	"target_type" "report"."report_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"category" text NOT NULL,
	"detail_text" text
);
