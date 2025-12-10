CREATE SCHEMA IF NOT EXISTS "report";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report"."content_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"reporter_user_id" text,
	"target_type" varchar(10) NOT NULL,
	"target_id" text NOT NULL,
	"category_main" varchar(10) NOT NULL,
	"category_detail" varchar(25) NOT NULL,
	"detail_text" text,
	"status" varchar(10) DEFAULT 'RECEIVED' NOT NULL,
	"processor_user_id" text,
	"processed_at" timestamp,
	"processing_note" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"notif_type" varchar(20) NOT NULL,
	"related_content_id" text,
	"message_body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "report"."content_reports" ADD CONSTRAINT "content_reports_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN	
ALTER TABLE "report"."content_reports" ADD CONSTRAINT "content_reports_processor_user_id_user_id_fk" FOREIGN KEY ("processor_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "report"."notifications" ADD CONSTRAINT "notifications_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "report_unique_user_target_detail" ON "report"."content_reports" USING btree ("reporter_user_id","target_type","target_id","category_detail");