CREATE TYPE "public"."business_request_kind" AS ENUM('close', 'reopen');--> statement-breakpoint
CREATE TYPE "public"."business_request_outcome" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('pending', 'active', 'suspended', 'closed');--> statement-breakpoint
CREATE TABLE "business_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"kind" "business_request_kind" NOT NULL,
	"note" varchar(500) DEFAULT '' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"outcome" "business_request_outcome"
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "status" "business_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_requests" ADD CONSTRAINT "business_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_requests" ADD CONSTRAINT "business_requests_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_requests" ADD CONSTRAINT "business_requests_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_requests_open_idx" ON "business_requests" USING btree ("business_id","author_id","kind") WHERE "business_requests"."resolved_at" is null;--> statement-breakpoint
CREATE INDEX "business_requests_resolved_at_idx" ON "business_requests" USING btree ("resolved_at","created_at");--> statement-breakpoint
CREATE INDEX "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
-- Existing businesses were already live; keep the suspended ones suspended.
UPDATE "businesses" SET "status" = CASE WHEN "suspended_at" IS NULL THEN 'active'::business_status ELSE 'suspended'::business_status END, "status_changed_at" = coalesce("suspended_at", now());
