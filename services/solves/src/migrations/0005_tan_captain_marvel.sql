CREATE TABLE IF NOT EXISTS "solves"."category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"parent_id" integer,
	"description" varchar(300),
	"ai_prompt" varchar(300),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_id" text
);
--> statement-breakpoint
ALTER TABLE IF EXISTS "solves"."category_main" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "solves"."category_sub" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE IF EXISTS "solves"."work_book_category" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint

DROP TABLE IF EXISTS "solves"."category_main" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "solves"."category_sub" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "solves"."work_book_category" CASCADE;--> statement-breakpoint


ALTER TABLE "solves"."work_books" ADD COLUMN IF NOT EXISTS "category_id" integer;--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."category" ADD CONSTRAINT "category_parent_id_category_id_fk" FOREIGN KEY ("parent_id") REFERENCES "solves"."category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."category" ADD CONSTRAINT "category_created_id_user_id_fk" FOREIGN KEY ("created_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_books" ADD CONSTRAINT "work_books_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "solves"."category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;