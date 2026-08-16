import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_members_gender" AS ENUM('male', 'female', 'unspecified');
  ALTER TABLE "members" ALTER COLUMN "photo_id" DROP NOT NULL;
  ALTER TABLE "members" ADD COLUMN "gender" "enum_members_gender";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" ALTER COLUMN "photo_id" SET NOT NULL;
  ALTER TABLE "members" DROP COLUMN "gender";
  DROP TYPE "public"."enum_members_gender";`)
}
