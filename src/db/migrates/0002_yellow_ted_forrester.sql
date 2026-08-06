DROP TABLE "hidden_words" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_private";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "mention_policy";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "notifications_paused_until";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "break_reminder_minutes";--> statement-breakpoint
DROP TYPE "public"."user__mention_policy";