CREATE TABLE "prob_books" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"tags" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prob_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"prob_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prob_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"prob_id" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"url" text,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "probs" (
	"id" text PRIMARY KEY NOT NULL,
	"prob_book_id" text NOT NULL,
	"title" text,
	"style" text NOT NULL,
	"answer_meta" json NOT NULL,
	"tags" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prob_contents" ADD CONSTRAINT "prob_contents_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prob_options" ADD CONSTRAINT "prob_options_prob_id_probs_id_fk" FOREIGN KEY ("prob_id") REFERENCES "public"."probs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "probs" ADD CONSTRAINT "probs_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "public"."prob_books"("id") ON DELETE cascade ON UPDATE no action;