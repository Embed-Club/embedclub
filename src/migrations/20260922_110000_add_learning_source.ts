import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Resources and Tutorials share `buildLearningFields`, so the "write it here"
// vs "link to a file or page" switch lands on both tables at once.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_resources_source" AS ENUM('manual', 'link');
  CREATE TYPE "public"."enum_tutorials_source" AS ENUM('manual', 'link');
  ALTER TABLE "resources" ADD COLUMN "source" "enum_resources_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "resources" ADD COLUMN "external_url" varchar;
  ALTER TABLE "tutorials" ADD COLUMN "source" "enum_tutorials_source" DEFAULT 'manual' NOT NULL;
  ALTER TABLE "tutorials" ADD COLUMN "external_url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "resources" DROP COLUMN "source";
  ALTER TABLE "resources" DROP COLUMN "external_url";
  ALTER TABLE "tutorials" DROP COLUMN "source";
  ALTER TABLE "tutorials" DROP COLUMN "external_url";
  DROP TYPE "public"."enum_resources_source";
  DROP TYPE "public"."enum_tutorials_source";`)
}
