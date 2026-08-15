import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DROP COLUMN "status";
  DROP TYPE "public"."enum_projects_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projects_status" AS ENUM('planned', 'inProgress', 'completed');
  ALTER TABLE "projects" ADD COLUMN "status" "enum_projects_status" DEFAULT 'inProgress' NOT NULL;`)
}
