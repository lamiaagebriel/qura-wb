ALTER TABLE "posts" ADD COLUMN "data" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
-- Offers' price and last day move into `data` (`endsOn`: the day, yyyy-mm-dd).
UPDATE "posts" SET "data" = jsonb_strip_nulls(jsonb_build_object('price', "price", 'endsOn', to_char("ends_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD'))) WHERE "type" = 'offer' AND ("price" IS NOT NULL OR "ends_at" IS NOT NULL);
