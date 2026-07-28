import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Gallery becomes an upload collection: one document per photo, holding the
 * file itself plus a caption. Previously it was a single document with a
 * `photos` array of picks from the Media library, so adding a photo meant
 * appending an array row one at a time — no bulk upload.
 *
 * The 32 existing photos are carried across by copying each referenced media
 * row's upload columns (filename, mime type, dimensions, and the generated
 * thumbnail/card/tablet sizes) onto a new gallery row. Gallery uses the same
 * bucket root and the same image sizes as `media`, so those filenames resolve
 * to files that already exist — nothing is re-uploaded and no file is moved.
 *
 * Note the consequence: a migrated gallery document and its original media
 * document point at the *same* object in the bucket. Deleting one deletes the
 * shared file.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "gallery" ADD COLUMN "_order" varchar;
  ALTER TABLE "gallery" ADD COLUMN "caption" varchar;
  ALTER TABLE "gallery" ADD COLUMN "url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "thumbnail_u_r_l" varchar;
  ALTER TABLE "gallery" ADD COLUMN "filename" varchar;
  ALTER TABLE "gallery" ADD COLUMN "mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "focal_x" numeric;
  ALTER TABLE "gallery" ADD COLUMN "focal_y" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_tablet_url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_tablet_width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_tablet_height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_tablet_mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_tablet_filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_tablet_filename" varchar;

  -- One new gallery row per photo, inheriting the media row's file metadata.
  -- DISTINCT ON filename guards the unique filename index an upload collection
  -- requires, in case two array rows ever pointed at the same media document.
  INSERT INTO "gallery" (
    "_order", "caption", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize",
    "width", "height", "focal_x", "focal_y",
    "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height",
    "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename",
    "sizes_card_url", "sizes_card_width", "sizes_card_height",
    "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename",
    "sizes_tablet_url", "sizes_tablet_width", "sizes_tablet_height",
    "sizes_tablet_mime_type", "sizes_tablet_filesize", "sizes_tablet_filename",
    "updated_at", "created_at"
  )
  SELECT
    'a' || substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', LEAST(rn, 62)::int, 1),
    caption, url, thumbnail_u_r_l, filename, mime_type, filesize,
    width, height, focal_x, focal_y,
    sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height,
    sizes_thumbnail_mime_type, sizes_thumbnail_filesize, sizes_thumbnail_filename,
    sizes_card_url, sizes_card_width, sizes_card_height,
    sizes_card_mime_type, sizes_card_filesize, sizes_card_filename,
    sizes_tablet_url, sizes_tablet_width, sizes_tablet_height,
    sizes_tablet_mime_type, sizes_tablet_filesize, sizes_tablet_filename,
    now(), now()
  FROM (
    SELECT row_number() OVER (ORDER BY d._order) AS rn, d.*
    FROM (
      SELECT DISTINCT ON (m.filename)
        gp."_order",
        gp.caption,
        m.url, m.thumbnail_u_r_l, m.filename, m.mime_type, m.filesize,
        m.width, m.height, m.focal_x, m.focal_y,
        m.sizes_thumbnail_url, m.sizes_thumbnail_width, m.sizes_thumbnail_height,
        m.sizes_thumbnail_mime_type, m.sizes_thumbnail_filesize, m.sizes_thumbnail_filename,
        m.sizes_card_url, m.sizes_card_width, m.sizes_card_height,
        m.sizes_card_mime_type, m.sizes_card_filesize, m.sizes_card_filename,
        m.sizes_tablet_url, m.sizes_tablet_width, m.sizes_tablet_height,
        m.sizes_tablet_mime_type, m.sizes_tablet_filesize, m.sizes_tablet_filename
      FROM "gallery_photos" gp
      JOIN "media" m ON m."id" = gp."image_id"
      WHERE m."filename" IS NOT NULL
      ORDER BY m.filename, gp."_order"
    ) d
  ) ordered;

  -- The old container document(s) carried no file of their own.
  DELETE FROM "gallery" WHERE "filename" IS NULL;

  DROP TABLE IF EXISTS "gallery_photos" CASCADE;

  CREATE UNIQUE INDEX "gallery_filename_idx" ON "gallery" USING btree ("filename");
  CREATE INDEX "gallery_order_idx" ON "gallery" USING btree ("_order");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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

  DROP INDEX IF EXISTS "gallery_filename_idx";
  DROP INDEX IF EXISTS "gallery_order_idx";

  -- Rebuild the single container document, then re-point each photo at the
  -- media row that shares its filename.
  INSERT INTO "gallery" ("updated_at", "created_at") VALUES (now(), now());

  INSERT INTO "gallery_photos" ("_order", "_parent_id", "id", "image_id", "caption")
    SELECT
      row_number() OVER (ORDER BY g."_order"),
      (SELECT "id" FROM "gallery" WHERE "filename" IS NULL ORDER BY "id" DESC LIMIT 1),
      gen_random_uuid()::text,
      m."id",
      g."caption"
    FROM "gallery" g
    JOIN "media" m ON m."filename" = g."filename"
    WHERE g."filename" IS NOT NULL;

  DELETE FROM "gallery" WHERE "filename" IS NOT NULL;

  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "caption";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "url";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "thumbnail_u_r_l";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "filename";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "mime_type";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "filesize";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "width";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "height";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "focal_x";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "focal_y";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_thumbnail_url";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_thumbnail_width";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_thumbnail_height";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_thumbnail_mime_type";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_thumbnail_filesize";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_thumbnail_filename";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_card_url";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_card_width";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_card_height";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_card_mime_type";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_card_filesize";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_card_filename";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_tablet_url";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_tablet_width";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_tablet_height";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_tablet_mime_type";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_tablet_filesize";
  ALTER TABLE "gallery" DROP COLUMN IF EXISTS "sizes_tablet_filename";`)
}
