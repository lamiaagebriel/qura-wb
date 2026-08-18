CREATE TABLE "business_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" varchar(500)
);
--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_review__business_id__author_id__idx" ON "business_reviews" USING btree ("business_id","author_id");--> statement-breakpoint
CREATE INDEX "business_review__business_id__idx" ON "business_reviews" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_review__author_id__idx" ON "business_reviews" USING btree ("author_id");