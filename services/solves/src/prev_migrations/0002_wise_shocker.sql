CREATE TABLE IF NOT EXISTS "solves"."workbook_create_chat_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workbook_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
ALTER TABLE "solves"."workbook_create_chat_thread" ADD CONSTRAINT "workbook_create_chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."workbook_create_chat_thread" ADD CONSTRAINT "workbook_create_chat_thread_workbook_id_prob_books_id_fk" FOREIGN KEY ("workbook_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."workbook_create_chat_thread" ADD CONSTRAINT "workbook_create_chat_thread_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "solves"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint