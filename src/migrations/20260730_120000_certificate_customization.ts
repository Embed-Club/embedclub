import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-form control over certificate wording: independent name-casing for the
 * printed certificate vs the email greeting (mirroring a prior manual
 * workflow that printed names in ALL CAPS but greeted people in Title Case),
 * plus an optional custom email subject/body with {{name}}/{{event}}
 * placeholders. Empty falls back to the Apps Script's plain defaults.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_forms_certificate_name_case" AS ENUM('asTyped', 'upper', 'title');

  ALTER TABLE "forms" ADD COLUMN "certificate_name_case" "enum_forms_certificate_name_case" DEFAULT 'asTyped';
  ALTER TABLE "forms" ADD COLUMN "certificate_email_name_case" "enum_forms_certificate_name_case" DEFAULT 'asTyped';
  ALTER TABLE "forms" ADD COLUMN "certificate_email_subject" varchar;
  ALTER TABLE "forms" ADD COLUMN "certificate_email_body" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_email_body";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_email_subject";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_email_name_case";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_name_case";

  DROP TYPE IF EXISTS "public"."enum_forms_certificate_name_case";`)
}
