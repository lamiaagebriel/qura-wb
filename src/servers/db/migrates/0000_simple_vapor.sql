CREATE TABLE "email_verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(8) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "email_verification_codes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar(40) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" varchar(15) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"username" varchar(255),
	"name" varchar(255) NOT NULL,
	"bio" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "stores_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"google_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"password" varchar(255),
	"image" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "verification_code_user_idx" ON "email_verification_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_code_email_idx" ON "email_verification_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "password_token_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_username_idx" ON "stores" USING btree ("username");--> statement-breakpoint
CREATE INDEX "store_created_at_idx" ON "stores" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_google_idx" ON "users" USING btree ("google_id");