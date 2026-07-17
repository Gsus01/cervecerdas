CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN
  CREATE TYPE "beer_action_type" AS ENUM ('BEER_ADDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" citext NOT NULL,
  "email" citext NOT NULL,
  "password_hash" varchar(60) NOT NULL,
  "beer_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_username_unique" UNIQUE("username"),
  CONSTRAINT "users_email_unique" UNIQUE("email"),
  CONSTRAINT "users_username_not_blank" CHECK (length(btrim("username"::text)) > 0),
  CONSTRAINT "users_beer_count_non_negative" CHECK ("beer_count" >= 0)
);

CREATE TABLE IF NOT EXISTS "beer_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "action_type" "beer_action_type" NOT NULL,
  "quantity" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "beer_logs_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "beer_logs_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "users_ranking_idx"
  ON "users" ("beer_count" DESC, "username" ASC);
CREATE INDEX IF NOT EXISTS "beer_logs_created_at_idx"
  ON "beer_logs" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "beer_logs_user_id_idx"
  ON "beer_logs" ("user_id");
