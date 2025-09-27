CREATE TABLE IF NOT EXISTS "prob_answer_meta" (
	"prob_id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"multiple" boolean,
	"randomized" boolean,
	"char_limit" integer,
	"lines" integer,
	"placeholder" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prob_books" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prob_book_tags" (
	"prob_book_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "prob_book_tags_prob_book_id_tag_id_pk" PRIMARY KEY("prob_book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prob_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"prob_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prob_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"prob_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"correct_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "probs" (
	"id" text PRIMARY KEY NOT NULL,
	"prob_book_id" text NOT NULL,
	"title" text,
	"style" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prob_tags" (
	"prob_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "prob_tags_prob_id_tag_id_pk" PRIMARY KEY("prob_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "prob_answer_meta" ADD CONSTRAINT "prob_answer_meta_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_book_tags" ADD CONSTRAINT "prob_book_tags_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "public"."prob_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_book_tags" ADD CONSTRAINT "prob_book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_contents" ADD CONSTRAINT "prob_contents_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_options" ADD CONSTRAINT "prob_options_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probs" ADD CONSTRAINT "probs_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "public"."prob_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_tags" ADD CONSTRAINT "prob_tags_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_tags" ADD CONSTRAINT "prob_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;