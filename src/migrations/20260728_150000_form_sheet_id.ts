import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Each form can mirror its responses to its own Google Sheet.
 *
 * One spreadsheet per form (rather than tabs in a shared one) means a sheet
 * only ever holds a single form's responses, so its columns can be that form's
 * actual questions instead of a JSON blob. Empty falls back to the
 * GOOGLE_SHEETS_ID env var, and failing that the form simply isn't mirrored.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "forms" ADD COLUMN "sheet_id" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "sheet_id";`)
}
