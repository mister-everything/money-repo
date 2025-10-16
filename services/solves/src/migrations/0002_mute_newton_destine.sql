ALTER TABLE "solves"."subscription_plans" ADD COLUMN IF NOT EXISTS "plans" jsonb;--> statement-breakpoint
ALTER TABLE "solves"."subscription_plans" DROP COLUMN IF EXISTS "content";