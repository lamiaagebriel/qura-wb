-- No admins any more: the last-super-admin guard, then the role and place admins.
DROP TRIGGER IF EXISTS users_keep_a_super_admin ON users;--> statement-breakpoint
DROP FUNCTION IF EXISTS users_keep_a_super_admin();--> statement-breakpoint
-- Tickets a place admin had sent on are waiting again.
UPDATE tickets SET status = 'open' WHERE status = 'escalated';--> statement-breakpoint
ALTER TABLE "place_admins" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "place_admins" CASCADE;--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_status_check";--> statement-breakpoint
DROP INDEX "tickets_open_key_idx";--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_open_key_idx" ON "tickets" USING btree ("open_key") WHERE "tickets"."status" in ('open');--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_check" CHECK ("tickets"."status" in ('open', 'approved', 'rejected', 'dismissed', 'cancelled'));--> statement-breakpoint
DROP TYPE "public"."user_role";