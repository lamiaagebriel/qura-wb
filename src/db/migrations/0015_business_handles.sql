CREATE TABLE "business_handles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handle" varchar(50) NOT NULL,
	"business_id" uuid NOT NULL,
	CONSTRAINT "business_handles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "business_handles" ADD CONSTRAINT "business_handles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_handles_business_id_idx" ON "business_handles" USING btree ("business_id");--> statement-breakpoint
-- Every table records its changes (rule 10).
SELECT history_attach('business_handles');