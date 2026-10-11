CREATE TYPE "public"."post_type" AS ENUM('general', 'question', 'together', 'experience', 'event', 'offer', 'announcement', 'job', 'housing', 'lost_found', 'alert');--> statement-breakpoint
CREATE TABLE "post_saves" (
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_saves_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "post_votes" (
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_votes_user_id_post_id_pk" PRIMARY KEY("user_id","post_id"),
	CONSTRAINT "post_votes_value_check" CHECK ("post_votes"."value" in (-1, 1))
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" uuid NOT NULL,
	"business_id" uuid,
	"parent_id" uuid,
	"type" "post_type" DEFAULT 'general' NOT NULL,
	"body" varchar(500) NOT NULL,
	"city" varchar(40) NOT NULL,
	"price" varchar(40),
	"ends_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "post_saves" ADD CONSTRAINT "post_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_saves" ADD CONSTRAINT "post_saves_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_saves_post_id_idx" ON "post_saves" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_votes_post_id_idx" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_city_type_created_at_idx" ON "posts" USING btree ("city","type","created_at");--> statement-breakpoint
CREATE INDEX "posts_business_id_created_at_idx" ON "posts" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "posts_parent_id_idx" ON "posts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "posts_created_by_id_idx" ON "posts" USING btree ("created_by_id");