-- Widen `business_block__category` from 2 values (restaurant/doctor) to
-- the 18 top-level categories. Postgres enums can't drop values in
-- place, so swap the column to `text`, recreate the type with the new
-- value set, remap the old data, then swap back.
ALTER TABLE "business_blocks" ALTER COLUMN "category" TYPE text;--> statement-breakpoint
DROP TYPE "public"."business_block__category";--> statement-breakpoint
CREATE TYPE "public"."business_block__category" AS ENUM(
  'food-drinks', 'health', 'beauty', 'creative', 'shopping', 'home-services',
  'automotive', 'education', 'tourism', 'professional-services',
  'real-estate', 'jobs', 'marketplace', 'community', 'events',
  'government', 'emergency', 'lifestyle'
);--> statement-breakpoint
UPDATE "business_blocks" SET "category" = CASE "category"
  WHEN 'restaurant' THEN 'food-drinks'
  WHEN 'doctor' THEN 'health'
  ELSE "category"
END;--> statement-breakpoint
ALTER TABLE "business_blocks" ALTER COLUMN "category" TYPE "public"."business_block__category" USING "category"::"public"."business_block__category";
