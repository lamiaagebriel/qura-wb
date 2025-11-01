CREATE TYPE "public"."payment_method" AS ENUM('cod', 'instapay');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'pending', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'fulfilled', 'cancelled', 'refunded', 'failed');--> statement-breakpoint
CREATE TABLE "qurawb__orders" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"address" json,
	"items" json,
	"expenses" json,
	"transactions" json,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "qurawb__stores" ALTER COLUMN "id" SET DATA TYPE varchar(21);--> statement-breakpoint
ALTER TABLE "qurawb__products" ALTER COLUMN "id" SET DATA TYPE varchar(21);--> statement-breakpoint
ALTER TABLE "qurawb__orders" ADD CONSTRAINT "qurawb__orders_store_id_qurawb__stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."qurawb__stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qurawb__orders" ADD CONSTRAINT "qurawb__orders_created_by_qurawb__users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."qurawb__users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qurawb__orders" ADD CONSTRAINT "qurawb__orders_user_id_qurawb__users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."qurawb__users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_store_idx" ON "qurawb__orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "qurawb__orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "qurawb__orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "qurawb__orders" USING btree ("status");