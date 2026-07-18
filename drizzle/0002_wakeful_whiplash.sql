CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
ALTER TABLE "beer_logs" DROP CONSTRAINT "beer_logs_beer_type_id_beer_types_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "beer_logs" ADD CONSTRAINT "beer_logs_beer_type_id_beer_types_id_fk" FOREIGN KEY ("beer_type_id") REFERENCES "public"."beer_types"("id") ON DELETE set null ON UPDATE no action;