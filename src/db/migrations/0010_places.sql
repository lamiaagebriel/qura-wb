CREATE TYPE "public"."admin_request_kind" AS ENUM('add', 'remove');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "place_admin_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"place_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"target_id" uuid NOT NULL,
	"kind" "admin_request_kind" NOT NULL,
	"note" varchar(500) DEFAULT '' NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"answer" varchar(500) DEFAULT '' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "place_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"place_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"type_id" uuid,
	"custom_type" varchar(50),
	"reason" varchar(500) DEFAULT '' NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"answer" varchar(500) DEFAULT '' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"place_id" uuid
);
--> statement-breakpoint
CREATE TABLE "place_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" jsonb NOT NULL,
	"listed" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"parent_id" uuid,
	"type_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"lat" double precision,
	"lng" double precision,
	CONSTRAINT "places_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "business_locations" ALTER COLUMN "city" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "city" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "place_admin_requests" ADD CONSTRAINT "place_admin_requests_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admin_requests" ADD CONSTRAINT "place_admin_requests_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admin_requests" ADD CONSTRAINT "place_admin_requests_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admin_requests" ADD CONSTRAINT "place_admin_requests_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admins" ADD CONSTRAINT "place_admins_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admins" ADD CONSTRAINT "place_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_requests" ADD CONSTRAINT "place_requests_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_requests" ADD CONSTRAINT "place_requests_parent_id_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_requests" ADD CONSTRAINT "place_requests_type_id_place_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."place_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_requests" ADD CONSTRAINT "place_requests_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_requests" ADD CONSTRAINT "place_requests_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_parent_id_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_type_id_place_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."place_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "place_admin_requests_open_idx" ON "place_admin_requests" USING btree ("place_id","target_id","kind") WHERE "place_admin_requests"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "place_admins_place_user_idx" ON "place_admins" USING btree ("place_id","user_id");--> statement-breakpoint
CREATE INDEX "place_admins_user_id_idx" ON "place_admins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "place_requests_parent_status_idx" ON "place_requests" USING btree ("parent_id","status","created_at");--> statement-breakpoint
CREATE INDEX "place_requests_author_id_idx" ON "place_requests" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "places_parent_id_idx" ON "places" USING btree ("parent_id");--> statement-breakpoint
INSERT INTO "place_types" ("id", "name") VALUES
	('00000000-0000-4000-8000-000000000001', '{"en":"City","ar":"مدينة","fr":"Ville"}'),
	('00000000-0000-4000-8000-000000000002', '{"en":"Markaz","ar":"مركز","fr":"Markaz"}'),
	('00000000-0000-4000-8000-000000000003', '{"en":"Village","ar":"قرية","fr":"Village"}'),
	('00000000-0000-4000-8000-000000000004', '{"en":"Neighborhood","ar":"حي","fr":"Quartier"}');--> statement-breakpoint
INSERT INTO "places" ("slug", "parent_id", "type_id", "name", "lat", "lng") VALUES
	('aswan', NULL, '00000000-0000-4000-8000-000000000001', '{"en":"Aswan","ar":"أسوان","fr":"Assouan"}', 24.0889, 32.8998),
	('luxor', NULL, '00000000-0000-4000-8000-000000000001', '{"en":"Luxor","ar":"الأقصر","fr":"Louxor"}', 25.6872, 32.6396),
	('qena', NULL, '00000000-0000-4000-8000-000000000001', '{"en":"Qena","ar":"قنا","fr":"Qena"}', 26.1551, 32.716);--> statement-breakpoint
INSERT INTO "places" ("slug", "parent_id", "type_id", "name", "lat", "lng")
SELECT v.slug, (SELECT "id" FROM "places" WHERE "slug" = 'aswan'), '00000000-0000-4000-8000-000000000002', v.name::jsonb, v.lat, v.lng
FROM (VALUES
	('kom-ombo', '{"en":"Kom Ombo","ar":"كوم أمبو","fr":"Kom Ombo"}', 24.4769, 32.9468),
	('edfu', '{"en":"Edfu","ar":"إدفو","fr":"Edfou"}', 24.9781, 32.8734),
	('daraw', '{"en":"Daraw","ar":"دراو","fr":"Daraou"}', 24.4003, 32.9306),
	('abu-simbel', '{"en":"Abu Simbel","ar":"أبو سمبل","fr":"Abou Simbel"}', 22.3372, 31.6258)
) AS v(slug, name, lat, lng);--> statement-breakpoint
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_city_places_slug_fk" FOREIGN KEY ("city") REFERENCES "public"."places"("slug") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_city_places_slug_fk" FOREIGN KEY ("city") REFERENCES "public"."places"("slug") ON DELETE no action ON UPDATE cascade;