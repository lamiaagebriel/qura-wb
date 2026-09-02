DROP INDEX "business_block__google_place_id__idx";--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD COLUMN "existing_owner_id" uuid;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_existing_owner_id_users_id_fk" FOREIGN KEY ("existing_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__created_at__idx" ON "google_place_claim_conflicts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "business_block__google_place_id__idx" ON "business_blocks" USING btree ("google_place_id");