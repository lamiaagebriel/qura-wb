-- `RENAME VALUE` (not drop/recreate) — Postgres enums store values by
-- internal id, so this relabels every row already using the misspelled
-- value too, with no data cast/backfill needed.
ALTER TYPE "public"."user__role" RENAME VALUE 'bussiness_owner' TO 'business_owner';
