import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ALTER COLUMN "thumbnail_id" DROP NOT NULL;
  ALTER TABLE "projects" ADD COLUMN "award" varchar;
  ALTER TABLE "projects" ADD COLUMN "event" varchar;
  ALTER TABLE "projects" ADD COLUMN "year" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" ALTER COLUMN "thumbnail_id" SET NOT NULL;
  ALTER TABLE "projects" DROP COLUMN "award";
  ALTER TABLE "projects" DROP COLUMN "event";
  ALTER TABLE "projects" DROP COLUMN "year";`)
}
