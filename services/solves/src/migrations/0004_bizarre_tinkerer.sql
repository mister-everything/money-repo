CREATE TABLE IF NOT EXISTS "solves"."work_book_likes" (
	"work_book_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "work_book_likes_work_book_id_user_id_pk" PRIMARY KEY("work_book_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."work_book_user_first_scores" (
	"work_book_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"submit_id" uuid NOT NULL,
	"first_submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_book_user_first_scores_work_book_id_owner_id_pk" PRIMARY KEY("work_book_id","owner_id")
);
--> statement-breakpoint
ALTER TABLE "solves"."work_books" ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "solves"."work_books" ADD COLUMN IF NOT EXISTS "first_score_sum" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "solves"."work_books" ADD COLUMN IF NOT EXISTS "first_solver_count" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."work_book_likes" ADD CONSTRAINT "work_book_likes_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_likes" ADD CONSTRAINT "work_book_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_user_first_scores" ADD CONSTRAINT "work_book_user_first_scores_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_user_first_scores" ADD CONSTRAINT "work_book_user_first_scores_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_user_first_scores" ADD CONSTRAINT "work_book_user_first_scores_submit_id_work_book_submits_id_fk" FOREIGN KEY ("submit_id") REFERENCES "solves"."work_book_submits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;