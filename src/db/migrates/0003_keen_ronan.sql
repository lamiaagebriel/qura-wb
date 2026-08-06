CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" varchar(500) NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "thread_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_parent_id_threads_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_likes" ADD CONSTRAINT "thread_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_likes" ADD CONSTRAINT "thread_likes_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "thread__author_id__idx" ON "threads" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "thread__parent_id__idx" ON "threads" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "thread__created_at__idx" ON "threads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "thread_like__user_id__thread_id__idx" ON "thread_likes" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "thread_like__thread_id__idx" ON "thread_likes" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_like__user_id__idx" ON "thread_likes" USING btree ("user_id");