CREATE TYPE "public"."business_report_outcome" AS ENUM('dismissed', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."business_report_reason" AS ENUM('fake', 'wrong_info', 'offensive', 'other');--> statement-breakpoint
CREATE TYPE "public"."post_report_outcome" AS ENUM('hidden', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."post_report_reason" AS ENUM('not_for_qura', 'spam', 'offensive', 'wrong_place', 'other');--> statement-breakpoint
CREATE TABLE "business_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" "business_report_reason" NOT NULL,
	"note" varchar(500) DEFAULT '' NOT NULL,
	"escalated_at" timestamp with time zone,
	"escalated_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"outcome" "business_report_outcome"
);
--> statement-breakpoint
CREATE TABLE "post_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"post_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reason" "post_report_reason" NOT NULL,
	"note" varchar(500) DEFAULT '' NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by_id" uuid,
	"outcome" "post_report_outcome"
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "hidden_reason" varchar(500) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "hidden_by_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "review_requested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "business_reports" ADD CONSTRAINT "business_reports_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reports" ADD CONSTRAINT "business_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reports" ADD CONSTRAINT "business_reports_escalated_by_id_users_id_fk" FOREIGN KEY ("escalated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reports" ADD CONSTRAINT "business_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_reports_open_idx" ON "business_reports" USING btree ("business_id","reporter_id") WHERE "business_reports"."resolved_at" is null;--> statement-breakpoint
CREATE INDEX "business_reports_business_id_idx" ON "business_reports" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_reports_open_idx" ON "post_reports" USING btree ("post_id","reporter_id") WHERE "post_reports"."resolved_at" is null;--> statement-breakpoint
CREATE INDEX "post_reports_post_id_idx" ON "post_reports" USING btree ("post_id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_hidden_by_id_users_id_fk" FOREIGN KEY ("hidden_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;