CREATE SCHEMA "solves";
--> statement-breakpoint
CREATE TYPE "solves"."invoice_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "solves"."invoice_type" AS ENUM('subscription', 'credit_purchase');--> statement-breakpoint
CREATE TYPE "solves"."subscription_period_status" AS ENUM('active', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "solves"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'expired');--> statement-breakpoint
CREATE TABLE "solves"."chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" text NOT NULL,
	"parts" json[],
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."chat_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."workbook_create_chat_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workbook_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."ai_provider_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"display_name" text NOT NULL,
	"model_type" text NOT NULL,
	"input_token_price" numeric(15, 8) NOT NULL,
	"output_token_price" numeric(15, 8) NOT NULL,
	"cached_token_price" numeric(15, 8) NOT NULL,
	"markup_rate" numeric(6, 3) DEFAULT '1.60' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"delta" numeric(15, 8) NOT NULL,
	"running_balance" numeric(15, 8) NOT NULL,
	"reason" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_ledger_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "solves"."credit_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(15, 8) DEFAULT '0.00000000' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balance_non_negative" CHECK ("solves"."credit_wallet"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "solves"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" uuid NOT NULL,
	"type" "solves"."invoice_type" DEFAULT 'credit_purchase' NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"purchased_credits" numeric(15, 8) NOT NULL,
	"status" "solves"."invoice_status" DEFAULT 'pending' NOT NULL,
	"external_ref" text,
	"external_order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "solves"."subscription_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"subscription_id" uuid NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" "solves"."subscription_period_status" DEFAULT 'active' NOT NULL,
	"period_type" text DEFAULT 'renewal' NOT NULL,
	"credits_granted" numeric(15, 8),
	"refill_count" integer DEFAULT 0 NOT NULL,
	"last_refill_at" timestamp,
	"invoice_id" uuid,
	"amount_paid" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"plans" jsonb,
	"price" numeric(15, 2) NOT NULL,
	"monthly_quota" numeric(15, 8) NOT NULL,
	"refill_amount" numeric(15, 8) NOT NULL,
	"refill_interval_hours" integer NOT NULL,
	"max_refill_count" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "solves"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"status" "solves"."subscription_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"canceled_at" timestamp,
	"expired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"price_id" uuid,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"calls" integer,
	"billable_credits" numeric(15, 8) NOT NULL,
	"provider_credits" numeric(15, 8),
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_book_id" uuid NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"question" text DEFAULT '' NOT NULL,
	"content" jsonb NOT NULL,
	"answer" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."category_main" (
	"category_main_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(300),
	"ai_prompt" varchar(300),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_id" text,
	CONSTRAINT "category_main_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "solves"."category_sub" (
	"category_sub_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"category_main_id" integer NOT NULL,
	"description" varchar(300),
	"ai_prompt" varchar(300),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_id" text,
	CONSTRAINT "category_sub_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "solves"."tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "solves"."block_submits" (
	"block_id" uuid NOT NULL,
	"submit_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "block_submits_block_id_submit_id_pk" PRIMARY KEY("block_id","submit_id")
);
--> statement-breakpoint
CREATE TABLE "solves"."work_book_category" (
	"work_book_id" uuid NOT NULL,
	"category_main_id" integer NOT NULL,
	"category_sub_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "work_book_category_work_book_id_category_main_id_category_sub_id_pk" PRIMARY KEY("work_book_id","category_main_id","category_sub_id")
);
--> statement-breakpoint
CREATE TABLE "solves"."work_book_submits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_book_id" uuid NOT NULL,
	"owner_id" text NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solves"."work_book_tags" (
	"work_book_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "work_book_tags_work_book_id_tag_id_pk" PRIMARY KEY("work_book_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "solves"."work_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(150) NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "solves"."chat_message" ADD CONSTRAINT "chat_message_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "solves"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."chat_thread" ADD CONSTRAINT "chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."workbook_create_chat_thread" ADD CONSTRAINT "workbook_create_chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."workbook_create_chat_thread" ADD CONSTRAINT "workbook_create_chat_thread_workbook_id_work_books_id_fk" FOREIGN KEY ("workbook_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."workbook_create_chat_thread" ADD CONSTRAINT "workbook_create_chat_thread_thread_id_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "solves"."chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."credit_ledger" ADD CONSTRAINT "credit_ledger_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."credit_wallet" ADD CONSTRAINT "credit_wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."invoices" ADD CONSTRAINT "invoices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."invoices" ADD CONSTRAINT "invoices_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."subscription_periods" ADD CONSTRAINT "subscription_periods_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "solves"."invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "solves"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."subscriptions" ADD CONSTRAINT "subscriptions_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_price_id_ai_provider_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "solves"."ai_provider_prices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."blocks" ADD CONSTRAINT "blocks_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."category_main" ADD CONSTRAINT "category_main_created_id_user_id_fk" FOREIGN KEY ("created_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."category_sub" ADD CONSTRAINT "category_sub_category_main_id_category_main_category_main_id_fk" FOREIGN KEY ("category_main_id") REFERENCES "solves"."category_main"("category_main_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."category_sub" ADD CONSTRAINT "category_sub_created_id_user_id_fk" FOREIGN KEY ("created_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."tags" ADD CONSTRAINT "tags_created_id_user_id_fk" FOREIGN KEY ("created_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."block_submits" ADD CONSTRAINT "block_submits_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "solves"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."block_submits" ADD CONSTRAINT "block_submits_submit_id_work_book_submits_id_fk" FOREIGN KEY ("submit_id") REFERENCES "solves"."work_book_submits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_category" ADD CONSTRAINT "work_book_category_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_category" ADD CONSTRAINT "work_book_category_category_main_id_category_main_category_main_id_fk" FOREIGN KEY ("category_main_id") REFERENCES "solves"."category_main"("category_main_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_category" ADD CONSTRAINT "work_book_category_category_sub_id_category_sub_category_sub_id_fk" FOREIGN KEY ("category_sub_id") REFERENCES "solves"."category_sub"("category_sub_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_submits" ADD CONSTRAINT "work_book_submits_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_submits" ADD CONSTRAINT "work_book_submits_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_tags" ADD CONSTRAINT "work_book_tags_work_book_id_work_books_id_fk" FOREIGN KEY ("work_book_id") REFERENCES "solves"."work_books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_book_tags" ADD CONSTRAINT "work_book_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "solves"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solves"."work_books" ADD CONSTRAINT "work_books_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_provider_prices_provider_model_idx" ON "solves"."ai_provider_prices" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX "credit_ledger_kind_created_idx" ON "solves"."credit_ledger" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "credit_ledger_user_idx" ON "solves"."credit_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_wallet_user_unique" ON "solves"."credit_wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_user_created_idx" ON "solves"."invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invoices_external_ref_idx" ON "solves"."invoices" USING btree ("external_ref");--> statement-breakpoint
CREATE INDEX "subscription_periods_sub_idx" ON "solves"."subscription_periods" USING btree ("subscription_id","period_start");--> statement-breakpoint
CREATE INDEX "subscription_periods_status_idx" ON "solves"."subscription_periods" USING btree ("status","period_end");--> statement-breakpoint
CREATE INDEX "subscription_periods_date_idx" ON "solves"."subscription_periods" USING btree ("period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_idx" ON "solves"."subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "solves"."subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_period_end_idx" ON "solves"."subscriptions" USING btree ("current_period_end","status");--> statement-breakpoint
CREATE INDEX "usage_events_user_created_idx" ON "solves"."usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_events_price_idx" ON "solves"."usage_events" USING btree ("price_id");