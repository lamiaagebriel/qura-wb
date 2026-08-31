ALTER TABLE "thread_likes" RENAME TO "thread_saves";--> statement-breakpoint
ALTER TABLE "thread_saves" DROP CONSTRAINT "thread_likes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "thread_saves" DROP CONSTRAINT "thread_likes_thread_id_threads_id_fk";
--> statement-breakpoint
DROP INDEX "thread_like__user_id__thread_id__idx";--> statement-breakpoint
DROP INDEX "thread_like__thread_id__idx";--> statement-breakpoint
DROP INDEX "thread_like__user_id__idx";--> statement-breakpoint
ALTER TABLE "thread_saves" ADD CONSTRAINT "thread_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_saves" ADD CONSTRAINT "thread_saves_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "thread_save__user_id__thread_id__idx" ON "thread_saves" USING btree ("user_id","thread_id");--> statement-breakpoint
CREATE INDEX "thread_save__thread_id__idx" ON "thread_saves" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_save__user_id__idx" ON "thread_saves" USING btree ("user_id");