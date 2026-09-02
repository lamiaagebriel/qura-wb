CREATE TABLE "business_google_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_place_id" varchar(255) NOT NULL,
	"label" varchar(255)
);
--> statement-breakpoint
DROP INDEX "business_block__google_place_id__idx";--> statement-breakpoint
ALTER TABLE "business_google_places" ADD CONSTRAINT "business_google_places_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_google_place__business_id__google_place_id__idx" ON "business_google_places" USING btree ("business_id","google_place_id");--> statement-breakpoint
CREATE INDEX "business_google_place__google_place_id__idx" ON "business_google_places" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "business_google_place__business_id__idx" ON "business_google_places" USING btree ("business_id");--> statement-breakpoint
INSERT INTO "business_google_places" ("business_id", "google_place_id")
SELECT "business_id", "google_place_id" FROM "business_blocks" WHERE "google_place_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "business_blocks" DROP COLUMN "google_place_id";