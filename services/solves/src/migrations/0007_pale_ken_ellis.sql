UPDATE "solves"."work_book_submits" 
SET "end_time" = "start_time" 
WHERE "end_time" IS NULL;


DO $$ BEGIN
ALTER TABLE "solves"."work_book_submits" ALTER COLUMN "end_time" SET DEFAULT now();
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN 
ALTER TABLE "solves"."work_book_submits" ALTER COLUMN "end_time" SET NOT NULL;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
ALTER TABLE "solves"."work_book_submits" DROP COLUMN IF EXISTS "active";
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;