CREATE TABLE "admin_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_id" uuid,
	"resource" varchar(40) NOT NULL,
	"record_key" varchar(120) NOT NULL,
	"record_label" varchar(200) DEFAULT '' NOT NULL,
	"action" varchar(40) NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"note" varchar(500) DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_created_at_idx" ON "admin_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_audit_record_idx" ON "admin_audit" USING btree ("resource","record_key");