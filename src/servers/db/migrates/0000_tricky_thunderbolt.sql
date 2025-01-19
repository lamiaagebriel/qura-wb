CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'USER', 'MERCHANT');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"items" json DEFAULT '[]'::json,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"shipping" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"shipping_address" json NOT NULL,
	"billing_address" json,
	"notes" text,
	"currency" varchar(3) DEFAULT 'USD',
	"tracking_number" varchar(100),
	"estimated_delivery" timestamp with time zone,
	"cancel_reason" text,
	"refund_reason" text,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"url" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	CONSTRAINT "pages_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "product_status" DEFAULT 'DRAFT' NOT NULL,
	"images" json,
	"stock" integer,
	"price" numeric(10, 2),
	"discount" numeric(10, 2),
	"cost" numeric(10, 2),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"title" varchar(255),
	"content" text,
	"rating" numeric(2, 1) NOT NULL,
	"images" varchar(255),
	"is_verified" boolean DEFAULT false,
	"helpful" integer DEFAULT 0,
	"reply" text,
	"replied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" varchar(21),
	"username" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(255) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD',
	"language" varchar(2) DEFAULT 'en',
	"logo" varchar(255),
	"banner" varchar(255),
	"bio" text,
	CONSTRAINT "stores_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"google_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_details" json,
	"reset_details" json,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"name" varchar(255),
	"image" varchar(255),
	"phone" varchar(20),
	"address" json,
	"preferences" json DEFAULT '{}'::json,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_store_idx" ON "orders" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "order_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_url_idx" ON "pages" USING btree ("url");--> statement-breakpoint
CREATE INDEX "page_store_idx" ON "pages" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "page_created_at_idx" ON "pages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_store_idx" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_price_idx" ON "products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "product_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "review_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "review_order_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "review_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "review_created_at_idx" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "store_username_idx" ON "stores" USING btree ("username");--> statement-breakpoint
CREATE INDEX "store_user_idx" ON "stores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_category_idx" ON "stores" USING btree ("category");--> statement-breakpoint
CREATE INDEX "store_created_at_idx" ON "stores" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_google_idx" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");