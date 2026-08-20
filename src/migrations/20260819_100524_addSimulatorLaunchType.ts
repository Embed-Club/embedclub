import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_simulators_launch_type" AS ENUM('website', 'download');
  ALTER TABLE "simulators" ADD COLUMN "launch_type" "enum_simulators_launch_type" DEFAULT 'website' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "simulators" DROP COLUMN "launch_type";
  DROP TYPE "public"."enum_simulators_launch_type";`)
}
