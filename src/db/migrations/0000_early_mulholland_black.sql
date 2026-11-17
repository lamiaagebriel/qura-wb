-- At least one language written in an `{ en, ar }` value (rule 18).
CREATE OR REPLACE FUNCTION has_text(value jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce(btrim(value ->> 'en'), '') <> '' OR coalesce(btrim(value ->> 'ar'), '') <> ''
$$;--> statement-breakpoint

CREATE TYPE "public"."user_role" AS ENUM('member', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('pending', 'active', 'suspended', 'closed', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('visible', 'hidden', 'under_review');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('general', 'question', 'together', 'experience', 'event', 'offer', 'announcement', 'job', 'housing', 'lost_found', 'alert');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
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
	"user_agent" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
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
	"role" "user_role" DEFAULT 'member' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"username" varchar(50) NOT NULL,
	"bio" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
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
CREATE TABLE "business_follows" (
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_follows_user_id_business_id_pk" PRIMARY KEY("user_id","business_id")
);
--> statement-breakpoint
CREATE TABLE "business_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"address" jsonb NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	CONSTRAINT "business_locations_lat_check" CHECK ("business_locations"."lat" between -90 and 90),
	CONSTRAINT "business_locations_lng_check" CHECK ("business_locations"."lng" between -180 and 180),
	CONSTRAINT "business_locations_address_check" CHECK (has_text("business_locations"."address"))
);
--> statement-breakpoint
CREATE TABLE "business_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"business_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"text" varchar(1000) DEFAULT '' NOT NULL,
	"status" "review_status" DEFAULT 'visible' NOT NULL,
	CONSTRAINT "business_reviews_rating_check" CHECK ("business_reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner_id" uuid,
	"created_by_id" uuid,
	"username" varchar(50) NOT NULL,
	"name" jsonb NOT NULL,
	"bio" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category" varchar(50) NOT NULL,
	"time_zone" varchar(64) NOT NULL,
	"image" text,
	"verified" boolean DEFAULT false NOT NULL,
	"status" "business_status" DEFAULT 'pending' NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hours" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "businesses_username_unique" UNIQUE("username"),
	CONSTRAINT "businesses_name_check" CHECK (has_text("businesses"."name"))
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"entry" varchar(10) NOT NULL,
	"action_id" bigint,
	"actor_id" uuid,
	"source" varchar(12) NOT NULL,
	"action" varchar(60),
	"input" jsonb,
	"note" text,
	"table_name" varchar(63),
	"record_id" varchar(120),
	"op" varchar(6),
	"changes" jsonb,
	"row" jsonb,
	CONSTRAINT "history_entry_check" CHECK ("history"."entry" in ('action', 'change')),
	CONSTRAINT "history_source_check" CHECK ("history"."source" in ('app', 'dashboard', 'seed', 'sql', 'system')),
	CONSTRAINT "history_op_check" CHECK ("history"."op" is null or "history"."op" in ('insert', 'update', 'delete'))
);
--> statement-breakpoint
CREATE TABLE "place_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"place_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" jsonb NOT NULL,
	"listed" boolean DEFAULT true NOT NULL,
	CONSTRAINT "place_types_name_check" CHECK (has_text("place_types"."name"))
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"parent_id" uuid,
	"type_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"lat" double precision,
	"lng" double precision,
	CONSTRAINT "places_slug_unique" UNIQUE("slug"),
	CONSTRAINT "places_name_check" CHECK (has_text("places"."name"))
);
--> statement-breakpoint
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
	"place_id" uuid NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "post_status" DEFAULT 'visible' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_by_id" uuid NOT NULL,
	"refs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"open_key" varchar(400),
	CONSTRAINT "tickets_status_check" CHECK ("tickets"."status" in ('open', 'escalated', 'approved', 'rejected', 'dismissed', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_follows" ADD CONSTRAINT "business_follows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_follows" ADD CONSTRAINT "business_follows_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_reviews" ADD CONSTRAINT "business_reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_action_id_history_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."history"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admins" ADD CONSTRAINT "place_admins_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_admins" ADD CONSTRAINT "place_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_parent_id_places_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_type_id_place_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."place_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_saves" ADD CONSTRAINT "post_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_saves" ADD CONSTRAINT "post_saves_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_votes" ADD CONSTRAINT "post_votes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_id_account_id_idx" ON "accounts" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "business_follows_business_id_idx" ON "business_follows" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_locations_business_id_idx" ON "business_locations" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_locations_place_id_idx" ON "business_locations" USING btree ("place_id","business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "business_reviews_business_author_idx" ON "business_reviews" USING btree ("business_id","author_id");--> statement-breakpoint
CREATE INDEX "business_reviews_business_created_idx" ON "business_reviews" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "business_reviews_author_id_idx" ON "business_reviews" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "businesses_owner_id_idx" ON "businesses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "businesses_created_by_id_idx" ON "businesses" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "businesses_category_idx" ON "businesses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "history_record_idx" ON "history" USING btree ("table_name","record_id","id");--> statement-breakpoint
CREATE INDEX "history_actor_idx" ON "history" USING btree ("actor_id","id");--> statement-breakpoint
CREATE INDEX "history_action_id_idx" ON "history" USING btree ("action_id");--> statement-breakpoint
CREATE INDEX "history_action_idx" ON "history" USING btree ("action","id");--> statement-breakpoint
CREATE UNIQUE INDEX "place_admins_place_user_idx" ON "place_admins" USING btree ("place_id","user_id");--> statement-breakpoint
CREATE INDEX "place_admins_user_id_idx" ON "place_admins" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "place_types_name_en_idx" ON "place_types" USING btree (lower("name"->>'en'));--> statement-breakpoint
CREATE UNIQUE INDEX "place_types_name_ar_idx" ON "place_types" USING btree (lower("name"->>'ar'));--> statement-breakpoint
CREATE INDEX "places_parent_id_idx" ON "places" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "post_saves_post_id_idx" ON "post_saves" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_votes_post_id_idx" ON "post_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_place_type_created_at_idx" ON "posts" USING btree ("place_id","type","created_at");--> statement-breakpoint
CREATE INDEX "posts_business_id_created_at_idx" ON "posts" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "posts_parent_id_idx" ON "posts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "posts_created_by_id_idx" ON "posts" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_open_key_idx" ON "tickets" USING btree ("open_key") WHERE "tickets"."status" in ('open', 'escalated');--> statement-breakpoint
CREATE INDEX "tickets_type_status_created_idx" ON "tickets" USING btree ("type","status","created_at");--> statement-breakpoint
CREATE INDEX "tickets_created_by_id_idx" ON "tickets" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "tickets_refs_idx" ON "tickets" USING gin ("refs");--> statement-breakpoint
-- ── 4. Rules the database keeps itself ───────────────────────────────

-- History: one trigger on every table writes each row change. The app
-- says who and which action (`set_config('qura.*', …, true)` inside the
-- action's transaction); without that it's recorded as source "sql".
-- Emails, sign-in secrets and `updated_at` never go in (rule 14).
CREATE OR REPLACE FUNCTION history_record_change() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  hidden text[] := ARRAY['email','token','password','access_token','refresh_token','id_token','updated_at'];
  old_row jsonb;
  new_row jsonb;
  diff jsonb;
  rid text;
  actor uuid := nullif(current_setting('qura.actor_id', true), '')::uuid;
  act bigint := nullif(current_setting('qura.action_id', true), '')::bigint;
  src text := coalesce(nullif(current_setting('qura.source', true), ''), 'sql');
BEGIN
  IF TG_OP <> 'INSERT' THEN old_row := to_jsonb(OLD) - hidden; END IF;
  IF TG_OP <> 'DELETE' THEN new_row := to_jsonb(NEW) - hidden; END IF;
  -- The record's key: its primary key columns (passed by history_attach).
  SELECT string_agg(coalesce(new_row, old_row) ->> k, ':' ORDER BY n) INTO rid
  FROM unnest(TG_ARGV) WITH ORDINALITY AS t(k, n);
  IF TG_OP = 'UPDATE' THEN
    SELECT jsonb_object_agg(k, jsonb_build_array(old_row -> k, new_row -> k)) INTO diff
    FROM jsonb_object_keys(new_row) AS k
    WHERE (old_row -> k) IS DISTINCT FROM (new_row -> k);
    -- Only `updated_at` (or nothing) changed: nothing to record.
    IF diff IS NULL THEN RETURN NULL; END IF;
  ELSIF TG_OP = 'INSERT' THEN
    SELECT jsonb_object_agg(k, jsonb_build_array(NULL, new_row -> k)) INTO diff
    FROM jsonb_object_keys(new_row) AS k
    WHERE new_row -> k <> 'null'::jsonb;
  END IF;
  INSERT INTO history (entry, action_id, actor_id, source, table_name, record_id, op, changes, "row")
  VALUES ('change', act, actor, src, TG_TABLE_NAME, rid, lower(TG_OP), diff,
          CASE WHEN TG_OP = 'DELETE' THEN old_row END);
  RETURN NULL;
END $$;--> statement-breakpoint

-- Puts the history trigger on a table (keyed by its primary key). Left
-- out: history itself, sign-in internals, votes and saves (rule 8).
CREATE OR REPLACE FUNCTION history_attach(target regclass) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  tbl text := (SELECT relname FROM pg_class WHERE oid = target);
  keys text[];
BEGIN
  IF tbl = ANY (ARRAY['history','sessions','accounts','verifications','rate_limits','post_votes','post_saves']) THEN
    RETURN;
  END IF;
  SELECT array_agg(a.attname::text ORDER BY k.n) INTO keys
  FROM pg_index i
  CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, n)
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
  WHERE i.indrelid = target AND i.indisprimary;
  IF keys IS NULL THEN RETURN; END IF;
  EXECUTE format('DROP TRIGGER IF EXISTS history ON %s', target);
  EXECUTE format(
    'CREATE TRIGGER history AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION history_record_change(%s)',
    target, (SELECT string_agg(quote_literal(k), ', ') FROM unnest(keys) AS k));
END $$;--> statement-breakpoint

SELECT history_attach(c.oid)
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r';--> statement-breakpoint

-- Tables made by later migrations get it automatically (rule 10). Hosts
-- that don't allow event triggers skip this; a test checks every table.
CREATE OR REPLACE FUNCTION history_attach_new_tables() RETURNS event_trigger
LANGUAGE plpgsql AS $$
DECLARE obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
             WHERE command_tag = 'CREATE TABLE' AND schema_name = 'public' LOOP
    PERFORM history_attach(obj.objid::regclass);
  END LOOP;
END $$;--> statement-breakpoint
DO $$
BEGIN
  DROP EVENT TRIGGER IF EXISTS history_attach_new_tables;
  CREATE EVENT TRIGGER history_attach_new_tables ON ddl_command_end
    WHEN TAG IN ('CREATE TABLE') EXECUTE FUNCTION history_attach_new_tables();
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Event triggers not allowed here: attach history in each migration (the history test checks).';
END $$;--> statement-breakpoint

-- People are anonymized, never deleted (rule 1). `qura.allow_user_delete`
-- is for tooling that has to (tests, a full reset).
CREATE OR REPLACE FUNCTION users_no_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('qura.allow_user_delete', true) = 'on' THEN RETURN OLD; END IF;
  RAISE EXCEPTION 'People are anonymized, never deleted' USING ERRCODE = 'restrict_violation';
END $$;--> statement-breakpoint
CREATE TRIGGER users_no_delete BEFORE DELETE ON users FOR EACH ROW EXECUTE FUNCTION users_no_delete();--> statement-breakpoint

-- There's always an active super admin (rule 16).
CREATE OR REPLACE FUNCTION users_keep_a_super_admin() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'super_admin' AND OLD.status = 'active'
     AND (TG_OP = 'DELETE' OR NEW.role <> 'super_admin' OR NEW.status <> 'active')
     AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'super_admin' AND status = 'active' AND id <> OLD.id) THEN
    RAISE EXCEPTION 'The last super admin can''t be removed' USING ERRCODE = 'check_violation';
  END IF;
  RETURN coalesce(NEW, OLD);
END $$;--> statement-breakpoint
CREATE TRIGGER users_keep_a_super_admin BEFORE UPDATE OF role, status OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION users_keep_a_super_admin();--> statement-breakpoint

-- A place can't be inside itself or anything inside it (rule 3).
CREATE OR REPLACE FUNCTION places_no_cycle() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.parent_id = NEW.id OR EXISTS (
    WITH RECURSIVE up AS (
      SELECT id, parent_id FROM places WHERE id = NEW.parent_id
      UNION ALL
      SELECT p.id, p.parent_id FROM places p JOIN up ON p.id = up.parent_id
    ) SELECT 1 FROM up WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'A place can''t be inside itself' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER places_no_cycle BEFORE INSERT OR UPDATE OF parent_id ON places
  FOR EACH ROW EXECUTE FUNCTION places_no_cycle();--> statement-breakpoint

-- A record that's deleted closes the open tickets about it (rule 2).
CREATE OR REPLACE FUNCTION tickets_close_on_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tickets SET status = 'cancelled', updated_at = now()
  WHERE status IN ('open', 'escalated')
    AND refs @> jsonb_build_array(jsonb_build_object('table', TG_TABLE_NAME, 'id', OLD.id::text));
  RETURN NULL;
END $$;--> statement-breakpoint
CREATE TRIGGER tickets_close_on_delete AFTER DELETE ON places FOR EACH ROW EXECUTE FUNCTION tickets_close_on_delete();--> statement-breakpoint
CREATE TRIGGER tickets_close_on_delete AFTER DELETE ON businesses FOR EACH ROW EXECUTE FUNCTION tickets_close_on_delete();--> statement-breakpoint
CREATE TRIGGER tickets_close_on_delete AFTER DELETE ON posts FOR EACH ROW EXECUTE FUNCTION tickets_close_on_delete();--> statement-breakpoint
CREATE TRIGGER tickets_close_on_delete AFTER DELETE ON business_reviews FOR EACH ROW EXECUTE FUNCTION tickets_close_on_delete();--> statement-breakpoint
CREATE TRIGGER tickets_close_on_delete AFTER DELETE ON users FOR EACH ROW EXECUTE FUNCTION tickets_close_on_delete();
