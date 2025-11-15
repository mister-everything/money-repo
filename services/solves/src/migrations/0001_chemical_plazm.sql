DO $$ BEGIN
ALTER TABLE "solves"."credit_ledger" ADD COLUMN "idempotency_key" text NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."credit_ledger" ADD CONSTRAINT "credit_ledger_idempotency_key_unique" UNIQUE("idempotency_key");
  EXCEPTION
    WHEN duplicate_object THEN null;
END $$;