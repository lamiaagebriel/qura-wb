CREATE TYPE "public"."business_block__category" AS ENUM('food-drinks', 'health', 'beauty', 'creative', 'shopping', 'home-services', 'automotive', 'education', 'tourism', 'professional-services', 'real-estate', 'jobs', 'marketplace', 'community', 'events', 'government', 'emergency', 'lifestyle');--> statement-breakpoint
CREATE TYPE "public"."city" AS ENUM('aswan', 'luxor', 'cairo', 'alexandria', 'qena', 'hurghada', 'sharm-el-sheikh', 'sohag', 'marsa-alam');--> statement-breakpoint
CREATE TYPE "public"."google_place_claim_conflict__status" AS ENUM('conflict', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."user__role" AS ENUM('super_admin', 'business_owner');--> statement-breakpoint
CREATE TYPE "public"."user__status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."thread__category" AS ENUM('general', 'together', 'experience', 'question', 'offer', 'announcement', 'alert');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(255),
	"user_agent" varchar(512),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"category" "business_block__category" NOT NULL,
	"data" jsonb NOT NULL,
	"city" "city" DEFAULT 'aswan' NOT NULL,
	CONSTRAINT "business_blocks_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "business_google_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_place_id" varchar(255) NOT NULL,
	"label" varchar(255)
);
--> statement-breakpoint
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
CREATE TABLE "google_place_claim_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"google_place_id" varchar(255) NOT NULL,
	"attempting_business_id" uuid,
	"attempting_owner_id" uuid,
	"existing_business_id" uuid,
	"existing_owner_id" uuid,
	"status" "google_place_claim_conflict__status" DEFAULT 'conflict' NOT NULL
);
--> statement-breakpoint
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
	"reviews" jsonb,
	"fetched_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"refresh_locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user__role" DEFAULT 'business_owner' NOT NULL,
	"status" "user__status" DEFAULT 'pending' NOT NULL,
	"username" varchar(255) NOT NULL,
	"bio" text,
	"last_verification_email_sent_at" timestamp with time zone,
	"last_password_reset_email_sent_at" timestamp with time zone,
	"owner_id" uuid,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" varchar(500) NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"image_path" text NOT NULL,
	"city" "city" DEFAULT 'aswan' NOT NULL,
	"category" "thread__category" DEFAULT 'general' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"value" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_blocks" ADD CONSTRAINT "business_blocks_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_google_places" ADD CONSTRAINT "business_google_places_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_business_id_users_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_attempting_business_id_users_id_fk" FOREIGN KEY ("attempting_business_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_attempting_owner_id_users_id_fk" FOREIGN KEY ("attempting_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_existing_business_id_users_id_fk" FOREIGN KEY ("existing_business_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_place_claim_conflicts" ADD CONSTRAINT "google_place_claim_conflicts_existing_owner_id_users_id_fk" FOREIGN KEY ("existing_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_parent_id_threads_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_saves" ADD CONSTRAINT "thread_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_saves" ADD CONSTRAINT "thread_saves_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_votes" ADD CONSTRAINT "thread_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_votes" ADD CONSTRAINT "thread_votes_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account__provider_id__account_id__idx" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "account__user_id__idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session__user_id__idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session__expires_at__idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification__identifier__idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification__expires_at__idx" ON "verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "business_block__city__idx" ON "business_blocks" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "business_google_place__business_id__google_place_id__idx" ON "business_google_places" USING btree ("business_id","google_place_id");--> statement-breakpoint
CREATE INDEX "business_google_place__google_place_id__idx" ON "business_google_places" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "business_google_place__business_id__idx" ON "business_google_places" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_review__business_id__author_id__idx" ON "business_reviews" USING btree ("business_id","author_id");--> statement-breakpoint
CREATE INDEX "business_review__business_id__idx" ON "business_reviews" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_review__author_id__idx" ON "business_reviews" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__google_place_id__idx" ON "google_place_claim_conflicts" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__attempting_business_id__idx" ON "google_place_claim_conflicts" USING btree ("attempting_business_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__existing_business_id__idx" ON "google_place_claim_conflicts" USING btree ("existing_business_id");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__status__idx" ON "google_place_claim_conflicts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "google_place_claim_conflict__created_at__idx" ON "google_place_claim_conflicts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user__owner_id__idx" ON "users" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follow__follower_id__following_id__idx" ON "follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "follow__follower_id__idx" ON "follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "follow__following_id__idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "report__user_id__idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "thread__author_id__idx" ON "threads" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "thread__parent_id__idx" ON "threads" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "thread__created_at__idx" ON "threads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "thread__city__idx" ON "threads" USING btree ("city");--> statement-breakpoint
CREATE INDEX "thread__category__idx" ON "threads" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "thread_save__user_id__thread_id__idx" ON "thread_saves" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "thread_save__thread_id__idx" ON "thread_saves" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_save__user_id__idx" ON "thread_saves" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "thread_vote__user_id__thread_id__idx" ON "thread_votes" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "thread_vote__thread_id__idx" ON "thread_votes" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_vote__user_id__idx" ON "thread_votes" USING btree ("user_id");