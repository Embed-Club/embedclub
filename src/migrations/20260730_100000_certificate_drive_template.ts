import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Certificates are generated and emailed by an Apps Script web app (see
 * `scripts/appsScript/certificateSender.gs`) rather than by the site over SMTP.
 * GmailApp sends as the account that deployed the script, so the club address
 * is used with no SMTP host and no app password — which matters because the
 * pace.edu.in Workspace tenant is not ours to administer.
 *
 * This column holds the Google Slides file id of a form's own certificate
 * design. Empty falls back to the default template configured inside the
 * script, so a club running one design all year needs to set nothing here.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "forms" ADD COLUMN "certificate_template_drive_id" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_template_drive_id";`)
}
