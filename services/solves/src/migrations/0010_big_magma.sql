CREATE TABLE IF NOT EXISTS "solves"."work_book_comment_likes" (
	"comment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "work_book_comment_likes_comment_id_user_id_pk" PRIMARY KEY("comment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."work_book_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_book_id" uuid NOT NULL,
	"parent_id" uuid,
	"author_id" text,
	"body" varchar(300) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_reason" varchar(20)
);
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_comment_likes" ADD CONSTRAINT "work_book_comment_likes_comment_id_work_book_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "solves"."work_book_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_comment_likes" ADD CONSTRAINT "work_book_comment_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_comments" ADD CONSTRAINT "work_book_comments_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_comments" ADD CONSTRAINT "work_book_comments_parent_id_work_book_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "solves"."work_book_comments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."work_book_comments" ADD CONSTRAINT "work_book_comments_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
