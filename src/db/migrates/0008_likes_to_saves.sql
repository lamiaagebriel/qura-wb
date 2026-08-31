-- Replaces the public "like" with a private "save" (bookmark) — this
-- app's real public engagement signal is the helpful/not-helpful vote
-- (`thread_votes`), not a heart count. Drop-and-recreate rather than an
-- `ALTER TABLE ... RENAME`, since a "liked" row and a "saved" row don't
-- actually mean the same thing (a like was a public reaction; a save is
-- a private "read this later") — carrying the old rows forward under a
-- new name would misrepresent what they were.
DROP TABLE "thread_likes";--> statement-breakpoint
CREATE TABLE "thread_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "thread_saves" ADD CONSTRAINT "thread_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_saves" ADD CONSTRAINT "thread_saves_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "thread_save__user_id__thread_id__idx" ON "thread_saves" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "thread_save__thread_id__idx" ON "thread_saves" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_save__user_id__idx" ON "thread_saves" USING btree ("user_id");
