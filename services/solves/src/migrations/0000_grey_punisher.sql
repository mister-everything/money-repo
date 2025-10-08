CREATE SCHEMA IF NOT EXISTS "solves";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."prob_block_answer_submits" (
	"block_id" uuid NOT NULL,
	"submit_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prob_block_answer_submits_block_id_submit_id_pk" PRIMARY KEY("block_id","submit_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."prob_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prob_book_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"question" text,
	"content" jsonb NOT NULL,
	"answer" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."prob_book_submits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prob_book_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."prob_book_tags" (
	"prob_book_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "prob_book_tags_prob_book_id_tag_id_pk" PRIMARY KEY("prob_book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."prob_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"thumbnail" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_block_answer_submits" ADD CONSTRAINT "prob_block_answer_submits_block_id_prob_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "solves"."prob_blocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN	
ALTER TABLE "solves"."prob_block_answer_submits" ADD CONSTRAINT "prob_block_answer_submits_submit_id_prob_book_submits_id_fk" FOREIGN KEY ("submit_id") REFERENCES "solves"."prob_book_submits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_blocks" ADD CONSTRAINT "prob_blocks_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_book_submits" ADD CONSTRAINT "prob_book_submits_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_book_submits" ADD CONSTRAINT "prob_book_submits_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_book_tags" ADD CONSTRAINT "prob_book_tags_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_book_tags" ADD CONSTRAINT "prob_book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "solves"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."prob_books" ADD CONSTRAINT "prob_books_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint