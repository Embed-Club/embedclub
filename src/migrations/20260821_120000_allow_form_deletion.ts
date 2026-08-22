import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Form submissions are an audit trail and remain after a form is deleted.
 * The foreign key already uses ON DELETE SET NULL, so the column must allow
 * the orphaned response rows that deletion intentionally creates.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "form_submissions" ALTER COLUMN "form_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "form_submissions" ALTER COLUMN "form_id" SET NOT NULL;
  `)
}
