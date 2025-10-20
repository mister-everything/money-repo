CREATE SCHEMA IF NOT EXISTS "solves";
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'invoice_status' AND n.nspname = 'solves') THEN
CREATE TYPE "solves"."invoice_status" AS ENUM('pending', 'paid', 'failed');
END IF;
END $$;
--> statement-breakpoint

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'invoice_type' AND n.nspname = 'solves') THEN
CREATE TYPE "solves"."invoice_type" AS ENUM('subscription', 'credit_purchase');
END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'subscription_period_status' AND n.nspname = 'solves') THEN
CREATE TYPE "solves"."subscription_period_status" AS ENUM('active', 'completed', 'failed', 'refunded');
END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'subscription_status' AND n.nspname = 'solves') THEN
CREATE TYPE "solves"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'expired');
END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."ai_provider_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"model_type" text NOT NULL,
	"input_token_price" numeric(15, 2) NOT NULL,
	"output_token_price" numeric(15, 2) NOT NULL,
	"cached_token_price" numeric(15, 2) NOT NULL,
	"markup_rate" numeric(6, 3) DEFAULT '1.60' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"delta" numeric(15, 2) NOT NULL,
	"running_balance" numeric(15, 2) NOT NULL,
	"idempotency_key" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."credit_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balance_non_negative" CHECK ("solves"."credit_wallet"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" uuid NOT NULL,
	"type" "solves"."invoice_type" DEFAULT 'credit_purchase' NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"purchased_credits" numeric(15, 2) NOT NULL,
	"status" "solves"."invoice_status" DEFAULT 'pending' NOT NULL,
	"external_ref" text,
	"external_order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."subscription_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"period_start" timestamp NOT NULL,
	"subscription_id" uuid NOT NULL,
	"period_end" timestamp NOT NULL,
	"status" "solves"."subscription_period_status" DEFAULT 'active' NOT NULL,
	"period_type" text DEFAULT 'renewal' NOT NULL,
	"credits_granted" numeric(15, 2),
	"refill_count" integer DEFAULT 0 NOT NULL,
	"last_refill_at" timestamp,
	"invoice_id" uuid,
	"amount_paid" numeric(15, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"plans" jsonb,
	"price" numeric(15, 2) NOT NULL,
	"monthly_quota" numeric(15, 2) NOT NULL,
	"refill_amount" numeric(15, 2) NOT NULL,
	"refill_interval_hours" integer NOT NULL,
	"max_refill_count" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."subscriptions" (
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
CREATE TABLE IF NOT EXISTS "solves"."usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"price_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"calls" integer,
	"billable_credits" numeric(15, 2) NOT NULL,
	"request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
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
ALTER TABLE "solves"."credit_ledger" ADD CONSTRAINT "credit_ledger_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."credit_wallet" ADD CONSTRAINT "credit_wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."invoices" ADD CONSTRAINT "invoices_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."subscription_periods" ADD CONSTRAINT "subscription_periods_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "solves"."invoices"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "solves"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."subscriptions" ADD CONSTRAINT "subscriptions_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_price_id_ai_provider_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "solves"."ai_provider_prices"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
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
CREATE UNIQUE INDEX IF NOT EXISTS "ai_provider_prices_provider_model_idx" ON "solves"."ai_provider_prices" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_ledger_kind_created_idx" ON "solves"."credit_ledger" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_ledger_user_idx" ON "solves"."credit_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_wallet_idemp_uniq" ON "solves"."credit_ledger" USING btree ("wallet_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_wallet_user_unique" ON "solves"."credit_wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_user_created_idx" ON "solves"."invoices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_external_ref_idx" ON "solves"."invoices" USING btree ("external_ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_periods_sub_idx" ON "solves"."subscription_periods" USING btree ("subscription_id","period_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_periods_status_idx" ON "solves"."subscription_periods" USING btree ("status","period_end");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_periods_date_idx" ON "solves"."subscription_periods" USING btree ("period_start");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "solves"."subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "solves"."subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_period_end_idx" ON "solves"."subscriptions" USING btree ("current_period_end","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_user_created_idx" ON "solves"."usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_price_idx" ON "solves"."usage_events" USING btree ("price_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usage_events_user_idemp_uniq" ON "solves"."usage_events" USING btree ("user_id","request_id");