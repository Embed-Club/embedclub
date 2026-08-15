import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_member_categories_batch_order" AS ENUM('oldestFirst', 'newestFirst');
  ALTER TABLE "member_categories" ADD COLUMN "batch_order" "enum_member_categories_batch_order" DEFAULT 'oldestFirst' NOT NULL;`)

  // Every existing category keeps the oldest-first order it already had, except
  // Alumni, which was the reason for the field: the most recent batch to leave
  // should head the list, not the 2016 intake. Officers can change any of these
  // from the admin afterwards.
  await db.execute(sql`
   UPDATE "member_categories" SET "batch_order" = 'newestFirst' WHERE "slug" = 'alumni';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "member_categories" DROP COLUMN "batch_order";
  DROP TYPE "public"."enum_member_categories_batch_order";`)
}
