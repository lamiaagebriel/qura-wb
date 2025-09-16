CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'USER', 'MERCHANT');--> statement-breakpoint
CREATE TABLE "qurawb__sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qurawb__users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email" varchar(255) NOT NULL,
	"google_id" varchar(255),
	"password" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_details" json,
	"reset_details" json,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"name" varchar(255),
	"image" varchar(255),
	"phone" varchar(20),
	"address" json,
	"preferences" json DEFAULT '{}'::json,
	CONSTRAINT "qurawb__users_email_unique" UNIQUE("email"),
	CONSTRAINT "qurawb__users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "qurawb__sessions" ADD CONSTRAINT "qurawb__sessions_user_id_qurawb__users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."qurawb__users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "qurawb__sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_idx" ON "qurawb__sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "qurawb__users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_google_idx" ON "qurawb__users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "qurawb__users" USING btree ("role");