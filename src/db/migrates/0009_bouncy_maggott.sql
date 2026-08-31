CREATE TYPE "public"."city" AS ENUM('aswan', 'luxor', 'cairo', 'alexandria', 'qena', 'hurghada', 'sharm-el-sheikh', 'sohag', 'marsa-alam');--> statement-breakpoint
ALTER TABLE "business_blocks" ADD COLUMN "city" "city" DEFAULT 'aswan' NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "city" "city" DEFAULT 'aswan' NOT NULL;--> statement-breakpoint
CREATE INDEX "business_block__city__idx" ON "business_blocks" USING btree ("city");--> statement-breakpoint
CREATE INDEX "thread__city__idx" ON "threads" USING btree ("city");