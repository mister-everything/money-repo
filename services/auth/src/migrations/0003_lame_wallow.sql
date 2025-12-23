CREATE TABLE IF NOT EXISTS "auth"."policy_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"policy_version_id" text NOT NULL,
	"is_agreed" boolean DEFAULT true NOT NULL,
	"consented_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_policy_consent_user_id_policy_version_id" UNIQUE("user_id","policy_version_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."policy_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"effective_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_name" text,
	"created_by" text,
	CONSTRAINT "uniq_policy_version_type_version" UNIQUE("type","version")
);
--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN IF NOT EXISTS "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN IF NOT EXISTS "phone_number" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN IF NOT EXISTS "nickname" varchar(16);--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN IF NOT EXISTS "consented_at" timestamp;--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "auth"."policy_consent" ADD CONSTRAINT "policy_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "auth"."policy_consent" ADD CONSTRAINT "policy_consent_policy_version_id_policy_version_id_fk" FOREIGN KEY ("policy_version_id") REFERENCES "auth"."policy_version"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "auth"."policy_version" ADD CONSTRAINT "policy_version_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "auth"."user" ADD CONSTRAINT "user_public_id_unique" UNIQUE("public_id");
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint