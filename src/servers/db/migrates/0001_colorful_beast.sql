ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "attributes" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "combinations" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "subtotal";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "tax";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "shipping";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "billing_address";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "currency";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "tracking_number";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "estimated_delivery";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "cancel_reason";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "refund_reason";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "metadata";