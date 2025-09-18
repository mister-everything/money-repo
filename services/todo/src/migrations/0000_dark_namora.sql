CREATE SCHEMA IF NOT EXISTS "todo";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "todo"."todo" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
