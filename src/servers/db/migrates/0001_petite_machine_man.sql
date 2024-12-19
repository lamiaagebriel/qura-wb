CREATE TABLE "orders" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"details" json[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "pages_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"images" varchar(255)[],
	"price" numeric(2),
	"discount" numeric(2),
	"cost" numeric(2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"content" text,
	"rating" numeric(2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ALTER COLUMN "bio" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "category" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "currency" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "language" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "logo" varchar(255);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "location" json NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" varchar(255);--> statement-breakpoint
CREATE INDEX "order_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_store_idx" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_url_idx" ON "pages" USING btree ("url");--> statement-breakpoint
CREATE INDEX "page_store_idx" ON "pages" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "page_created_at_idx" ON "pages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_store_idx" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "review_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "review_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "store_user_idx" ON "stores" USING btree ("user_id");