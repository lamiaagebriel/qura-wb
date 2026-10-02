CREATE TYPE "public"."link_platform" AS ENUM('website', 'phone', 'whatsapp', 'facebook', 'instagram', 'tiktok', 'x', 'youtube', 'snapchat', 'telegram', 'linkedin');--> statement-breakpoint
CREATE TABLE "business_hours" (
	"business_id" uuid NOT NULL,
	"day" smallint NOT NULL,
	"opens" time NOT NULL,
	"closes" time NOT NULL,
	CONSTRAINT "business_hours_day_check" CHECK ("business_hours"."day" between 0 and 6),
	CONSTRAINT "business_hours_order_check" CHECK ("business_hours"."opens" < "business_hours"."closes")
);
--> statement-breakpoint
CREATE TABLE "business_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"platform" "link_platform" NOT NULL,
	"url" varchar(300) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"address" jsonb NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	CONSTRAINT "business_locations_lat_check" CHECK ("business_locations"."lat" between -90 and 90),
	CONSTRAINT "business_locations_lng_check" CHECK ("business_locations"."lng" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_id" uuid,
	"created_by_id" uuid,
	"username" varchar(50) NOT NULL,
	"name" jsonb NOT NULL,
	"bio" jsonb DEFAULT '{"en":""}'::jsonb NOT NULL,
	"category" varchar(50) NOT NULL,
	"time_zone" varchar(64) NOT NULL,
	"image" text,
	"verified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "businesses_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"text" varchar(1000) DEFAULT '' NOT NULL,
	CONSTRAINT "reviews_rating_check" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
DROP TABLE "profiles" CASCADE;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_links" ADD CONSTRAINT "business_links_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_hours_business_id_day_idx" ON "business_hours" USING btree ("business_id","day");--> statement-breakpoint
CREATE INDEX "business_links_business_id_idx" ON "business_links" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_locations_business_id_idx" ON "business_locations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "businesses_owner_id_idx" ON "businesses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "businesses_created_by_id_idx" ON "businesses" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "businesses_category_idx" ON "businesses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "follows_business_id_idx" ON "follows" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_business_id_author_id_idx" ON "reviews" USING btree ("business_id","author_id");--> statement-breakpoint
CREATE INDEX "reviews_business_id_created_at_idx" ON "reviews" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_author_id_idx" ON "reviews" USING btree ("author_id");--> statement-breakpoint
DROP TYPE "public"."profile_type";