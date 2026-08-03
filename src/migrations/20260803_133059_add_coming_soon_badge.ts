import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_resources_badge" ADD VALUE 'comingSoon';
  ALTER TYPE "public"."enum_tutorials_badge" ADD VALUE 'comingSoon';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "resources" ALTER COLUMN "badge" SET DATA TYPE text;
  DROP TYPE "public"."enum_resources_badge";
  CREATE TYPE "public"."enum_resources_badge" AS ENUM('featured', 'popular', 'essential');
  ALTER TABLE "resources" ALTER COLUMN "badge" SET DATA TYPE "public"."enum_resources_badge" USING "badge"::"public"."enum_resources_badge";
  ALTER TABLE "tutorials" ALTER COLUMN "badge" SET DATA TYPE text;
  DROP TYPE "public"."enum_tutorials_badge";
  CREATE TYPE "public"."enum_tutorials_badge" AS ENUM('featured', 'popular', 'essential');
  ALTER TABLE "tutorials" ALTER COLUMN "badge" SET DATA TYPE "public"."enum_tutorials_badge" USING "badge"::"public"."enum_tutorials_badge";`)
}
