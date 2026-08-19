import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "support_pages" DROP COLUMN "support_title";
  ALTER TABLE "support_pages" DROP COLUMN "support";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "support_pages" ADD COLUMN "support_title" varchar DEFAULT 'Support' NOT NULL;
  ALTER TABLE "support_pages" ADD COLUMN "support" jsonb;`)
}
