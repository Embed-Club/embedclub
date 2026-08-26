import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_achievement_settings_sort_order" AS ENUM('desc', 'asc');
  CREATE TABLE "achievement_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sort_order" "enum_achievement_settings_sort_order" DEFAULT 'desc' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "form_submissions" ALTER COLUMN "form_id" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "achievement_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "achievement_settings" CASCADE;
  ALTER TABLE "form_submissions" ALTER COLUMN "form_id" SET NOT NULL;
  DROP TYPE "public"."enum_achievement_settings_sort_order";`)
}
