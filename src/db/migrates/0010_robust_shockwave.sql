CREATE TYPE "public"."thread__category" AS ENUM('general', 'together', 'experience', 'question', 'offer', 'announcement', 'alert');--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "category" "thread__category" DEFAULT 'general' NOT NULL;--> statement-breakpoint
CREATE INDEX "thread__category__idx" ON "threads" USING btree ("category");