DO $$ BEGIN
 CREATE TYPE "public"."invoice_status" AS ENUM('pending', 'paid', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."credit_txn_kind" AS ENUM('purchase', 'grant', 'debit', 'refund', 'adjustment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."ai_provider_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"model_type" text NOT NULL,
	"input_token_price" numeric(12, 8) NOT NULL,
	"output_token_price" numeric(12, 8) NOT NULL,
	"markup_rate" numeric(6, 3) DEFAULT '1.60' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"kind" "credit_txn_kind" NOT NULL,
	"delta" numeric(18, 6) NOT NULL,
	"running_balance" numeric(18, 6) NOT NULL,
	"idempotency_key" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."credit_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" numeric(18, 6) DEFAULT '0' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balance_non_negative" CHECK ("solves"."credit_wallet"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."idempotency_keys" (
	"key" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"response" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"title" text NOT NULL,
	"amount_usd" numeric(18, 6) NOT NULL,
	"purchased_credits" numeric(18, 6) NOT NULL,
	"status" "invoice_status" DEFAULT 'pending' NOT NULL,
	"external_ref" text,
	"external_order_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solves"."usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"price_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer,
	"output_tokens" integer,
	"cached_tokens" integer,
	"calls" integer,
	"vendor_cost_usd" numeric(18, 6) NOT NULL,
	"billable_credits" numeric(18, 6) NOT NULL,
	"request_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "solves"."credit_ledger" ADD CONSTRAINT "credit_ledger_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "solves"."idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "solves"."invoices" ADD CONSTRAINT "invoices_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "solves"."invoices" ADD CONSTRAINT "invoices_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_wallet_id_credit_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "solves"."credit_wallet"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "solves"."usage_events" ADD CONSTRAINT "usage_events_price_id_ai_provider_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "solves"."ai_provider_prices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_provider_prices_provider_model_idx" ON "solves"."ai_provider_prices" USING btree ("provider","model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_ledger_wallet_created_idx" ON "solves"."credit_ledger" USING btree ("wallet_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_wallet_idemp_uniq" ON "solves"."credit_ledger" USING btree ("wallet_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_wallet_user_unique" ON "solves"."credit_wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idempotency_expires_at_idx" ON "solves"."idempotency_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_user_created_idx" ON "solves"."invoices" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoices_external_ref_idx" ON "solves"."invoices" USING btree ("external_ref");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_wallet_created_idx" ON "solves"."usage_events" USING btree ("wallet_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_user_created_idx" ON "solves"."usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usage_events_wallet_idemp_uniq" ON "solves"."usage_events" USING btree ("wallet_id","request_id");