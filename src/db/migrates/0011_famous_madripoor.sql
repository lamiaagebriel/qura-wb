CREATE TYPE "public"."google_place_claim_conflict__status" AS ENUM('conflict', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "google_place_claim_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"google_place_id" varchar(255) NOT NULL,
	"attempting_business_id" uuid,
	"attempting_owner_id" uuid,
	"existing_business_id" uuid,
	"status" "google_place_claim_conflict__status" DEFAULT 'conflict' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_blocks" ADD COLUMN "google_place_id" varchar(255);--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_attempting_business_id_users_id_fk" FOREIGN KEY ("attempting_business_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_attempting_owner_id_users_id_fk" FOREIGN KEY ("attempting_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_existing_business_id_users_id_fk" FOREIGN KEY ("existing_business_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__google_place_id__idx" ON "google_place_claim_conflicts" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__attempting_business_id__idx" ON "google_place_claim_conflicts" USING btree ("attempting_business_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__existing_business_id__idx" ON "google_place_claim_conflicts" USING btree ("existing_business_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__status__idx" ON "google_place_claim_conflicts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "business_block__google_place_id__idx" ON "business_blocks" USING btree ("google_place_id") WHERE "business_blocks"."google_place_id" IS NOT NULL;