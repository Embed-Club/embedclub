import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Media foreign keys use ON DELETE SET NULL. These fields therefore need to be
 * nullable so deleting an image can leave a content item in place and let the
 * frontend render its shared placeholder image.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ALTER COLUMN "image_id" DROP NOT NULL;
    ALTER TABLE "projects_blocks_image_block" ALTER COLUMN "image_id" DROP NOT NULL;
    ALTER TABLE "resources_blocks_image_block" ALTER COLUMN "image_id" DROP NOT NULL;
    ALTER TABLE "resources" ALTER COLUMN "thumbnail_id" DROP NOT NULL;
    ALTER TABLE "tutorials_blocks_image_block" ALTER COLUMN "image_id" DROP NOT NULL;
    ALTER TABLE "tutorials" ALTER COLUMN "thumbnail_id" DROP NOT NULL;
    ALTER TABLE "simulators_blocks_image_block" ALTER COLUMN "image_id" DROP NOT NULL;
    ALTER TABLE "simulators" ALTER COLUMN "thumbnail_id" DROP NOT NULL;
    ALTER TABLE "about_page_blocks_about_image_block" ALTER COLUMN "image_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ALTER COLUMN "image_id" SET NOT NULL;
    ALTER TABLE "projects_blocks_image_block" ALTER COLUMN "image_id" SET NOT NULL;
    ALTER TABLE "resources_blocks_image_block" ALTER COLUMN "image_id" SET NOT NULL;
    ALTER TABLE "resources" ALTER COLUMN "thumbnail_id" SET NOT NULL;
    ALTER TABLE "tutorials_blocks_image_block" ALTER COLUMN "image_id" SET NOT NULL;
    ALTER TABLE "tutorials" ALTER COLUMN "thumbnail_id" SET NOT NULL;
    ALTER TABLE "simulators_blocks_image_block" ALTER COLUMN "image_id" SET NOT NULL;
    ALTER TABLE "simulators" ALTER COLUMN "thumbnail_id" SET NOT NULL;
    ALTER TABLE "about_page_blocks_about_image_block" ALTER COLUMN "image_id" SET NOT NULL;
  `)
}
