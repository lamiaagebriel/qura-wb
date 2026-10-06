-- Existing branches: all seeded/real data so far is in Aswan.
ALTER TABLE "business_locations" ADD COLUMN "city" varchar(40) NOT NULL DEFAULT 'aswan';--> statement-breakpoint
ALTER TABLE "business_locations" ALTER COLUMN "city" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "business_locations_city_idx" ON "business_locations" USING btree ("city","business_id");
