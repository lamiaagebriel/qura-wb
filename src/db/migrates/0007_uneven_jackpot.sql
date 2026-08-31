CREATE TABLE "thread_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"value" smallint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thread_votes" ADD CONSTRAINT "thread_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_votes" ADD CONSTRAINT "thread_votes_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "thread_vote__user_id__thread_id__idx" ON "thread_votes" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "thread_vote__thread_id__idx" ON "thread_votes" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_vote__user_id__idx" ON "thread_votes" USING btree ("user_id");