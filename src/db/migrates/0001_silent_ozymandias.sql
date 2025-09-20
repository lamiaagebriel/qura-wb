CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "qurawb__products" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"images" json,
	"price" numeric(10, 2),
	"compare_to_price" numeric(10, 2),
	"cost" numeric(10, 2),
	"attributes" json DEFAULT '[]'::json,
	CONSTRAINT "qurawb__products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP INDEX "user_role_idx";--> statement-breakpoint
ALTER TABLE "qurawb__products" ADD CONSTRAINT "qurawb__products_store_id_qurawb__stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."qurawb__stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_slug_idx" ON "qurawb__products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_store_idx" ON "qurawb__products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "qurawb__products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_price_idx" ON "qurawb__products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "product_created_at_idx" ON "qurawb__products" USING btree ("created_at");