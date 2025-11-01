ALTER TABLE "qurawb__orders" DROP CONSTRAINT "qurawb__orders_created_by_qurawb__users_id_fk";
--> statement-breakpoint
ALTER TABLE "qurawb__orders" ADD COLUMN "actions" json;--> statement-breakpoint
ALTER TABLE "qurawb__orders" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "qurawb__orders" DROP COLUMN "transactions";--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
DROP TYPE "public"."payment_status";