CREATE TABLE "beer_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "citext" NOT NULL,
	"photo_data_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "beer_types_name_unique" UNIQUE("name"),
	CONSTRAINT "beer_types_name_not_blank" CHECK (length(btrim("beer_types"."name"::text)) > 0),
	CONSTRAINT "beer_types_photo_size" CHECK (length("beer_types"."photo_data_url") <= 1400000)
);
--> statement-breakpoint
ALTER TABLE "beer_logs" ADD COLUMN "beer_type_id" uuid;--> statement-breakpoint
ALTER TABLE "beer_logs" ADD CONSTRAINT "beer_logs_beer_type_id_beer_types_id_fk" FOREIGN KEY ("beer_type_id") REFERENCES "public"."beer_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beer_logs_beer_type_id_idx" ON "beer_logs" USING btree ("beer_type_id");
