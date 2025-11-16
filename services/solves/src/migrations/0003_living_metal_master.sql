CREATE TABLE "solves"."category_main" (
	"category_main_id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_main_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "solves"."category_sub" (
	"category_sub_id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(50) NOT NULL,
	"category_main_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_sub_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "solves"."prob_book_category" (
	"prob_book_id" uuid NOT NULL,
	"category_main_id" integer NOT NULL,
	"category_sub_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prob_book_category_prob_book_id_category_main_id_category_sub_id_pk" PRIMARY KEY("prob_book_id","category_main_id","category_sub_id")
);
--> statement-breakpoint
ALTER TABLE "solves"."category_sub" ADD CONSTRAINT "category_sub_category_main_id_category_main_category_main_id_fk" FOREIGN KEY ("category_main_id") REFERENCES "solves"."category_main"("category_main_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."prob_book_category" ADD CONSTRAINT "prob_book_category_prob_book_id_prob_books_id_fk" FOREIGN KEY ("prob_book_id") REFERENCES "solves"."prob_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."prob_book_category" ADD CONSTRAINT "prob_book_category_category_main_id_category_main_category_main_id_fk" FOREIGN KEY ("category_main_id") REFERENCES "solves"."category_main"("category_main_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."prob_book_category" ADD CONSTRAINT "prob_book_category_category_sub_id_category_sub_category_sub_id_fk" FOREIGN KEY ("category_sub_id") REFERENCES "solves"."category_sub"("category_sub_id") ON DELETE cascade ON UPDATE no action;