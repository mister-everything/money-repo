DO $$ BEGIN
ALTER TABLE "auth"."user" ADD COLUMN "deleted_at" timestamp;
EXCEPTION
	WHEN duplicate_column THEN null;
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
ALTER TABLE "auth"."user" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;
EXCEPTION
	WHEN duplicate_column THEN null;
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
