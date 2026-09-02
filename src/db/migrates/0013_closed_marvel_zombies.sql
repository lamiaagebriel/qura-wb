CREATE TABLE "google_places" (
	"place_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"latitude" real,
	"longitude" real,
	"types" text[] DEFAULT '{}' NOT NULL,
	"rating" real,
	"user_rating_count" integer,
	"business_status" varchar(255),
	"phone" varchar(255),
	"website" text,
	"opening_hours" jsonb,
	"fetched_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
