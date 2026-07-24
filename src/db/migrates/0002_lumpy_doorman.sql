DROP INDEX "user___email__idx";--> statement-breakpoint
CREATE INDEX "session__user_id__idx" ON "sessions" USING btree ("user_id");