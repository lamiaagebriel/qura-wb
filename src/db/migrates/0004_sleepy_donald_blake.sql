CREATE TYPE "public"."business_block__category" AS ENUM('restaurant', 'doctor');--> statement-breakpoint
CREATE TABLE "business_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"category" "business_block__category" NOT NULL,
	"data" jsonb NOT NULL,
	CONSTRAINT "business_blocks_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
ALTER TABLE "business_blocks" ADD CONSTRAINT "business_blocks_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;