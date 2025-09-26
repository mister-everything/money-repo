CREATE TABLE "prob_answer_meta" (
	"prob_id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"multiple" boolean,
	"randomized" boolean,
	"char_limit" integer,
	"lines" integer,
	"placeholder" text
);
--> statement-breakpoint
CREATE TABLE "prob_book_tags" (
	"prob_book_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "prob_book_tags_prob_book_id_tag_id_pk" PRIMARY KEY("prob_book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "prob_tags" (
	"prob_id" text NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "prob_tags_prob_id_tag_id_pk" PRIMARY KEY("prob_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "prob_options" ADD COLUMN "correct_order" integer;--> statement-breakpoint
ALTER TABLE "prob_answer_meta" ADD CONSTRAINT "prob_answer_meta_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_book_tags" ADD CONSTRAINT "prob_book_tags_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "public"."prob_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_book_tags" ADD CONSTRAINT "prob_book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_tags" ADD CONSTRAINT "prob_tags_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_tags" ADD CONSTRAINT "prob_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_books" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "probs" DROP COLUMN "answer_meta";--> statement-breakpoint
ALTER TABLE "probs" DROP COLUMN "tags";