import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gallery: replace the `images` (hasMany upload → gallery_rels) with a
 * `photos` array where each row is an image + caption. Existing image picks
 * are copied into the new array table (with empty captions) before the old
 * rels table is dropped, so no photos are lost.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "gallery_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );

  ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "gallery_photos_order_idx" ON "gallery_photos" USING btree ("_order");
  CREATE INDEX "gallery_photos_parent_id_idx" ON "gallery_photos" USING btree ("_parent_id");
  CREATE INDEX "gallery_photos_image_idx" ON "gallery_photos" USING btree ("image_id");

  -- Preserve existing image picks (gallery_rels) as photo rows with no caption
  INSERT INTO "gallery_photos" ("_order", "_parent_id", "id", "image_id", "caption")
    SELECT
      COALESCE("order", 1),
      "parent_id",
      gen_random_uuid()::text,
      "media_id",
      NULL
    FROM "gallery_rels"
    WHERE "media_id" IS NOT NULL;

  DROP TABLE IF EXISTS "gallery_rels" CASCADE;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "gallery_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );

  ALTER TABLE "gallery_rels" ADD CONSTRAINT "gallery_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_rels" ADD CONSTRAINT "gallery_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;

  INSERT INTO "gallery_rels" ("order", "parent_id", "path", "media_id")
    SELECT "_order", "_parent_id", 'images', "image_id" FROM "gallery_photos";

  DROP TABLE IF EXISTS "gallery_photos" CASCADE;`)
}
