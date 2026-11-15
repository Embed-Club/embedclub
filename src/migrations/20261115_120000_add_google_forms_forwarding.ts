import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Re-introduces Google Forms response forwarding:
 *
 * 1. forms.google_form_url stores the Google Form endpoint to forward submissions to.
 * 2. forms_steps_fields.google_entry_id stores the per-question Google entry ID.
 * 3. form_submissions.google_forward_status, google_forward_error, and google_forwarded_at
 *    track whether the submission was delivered to Google Forms.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_form_submissions_google_forward_status" AS ENUM('notApplicable', 'pending', 'forwarded', 'failed');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;

  ALTER TABLE "forms" ADD COLUMN IF NOT EXISTS "google_form_url" varchar;
  ALTER TABLE "forms_steps_fields" ADD COLUMN IF NOT EXISTS "google_entry_id" varchar;

  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "google_forward_status" "enum_form_submissions_google_forward_status" DEFAULT 'notApplicable';
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "google_forward_error" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN IF NOT EXISTS "google_forwarded_at" timestamp(3) with time zone;

  CREATE INDEX IF NOT EXISTS "form_submissions_google_forward_status_idx" ON "form_submissions" USING btree ("google_forward_status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "form_submissions_google_forward_status_idx";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "google_forwarded_at";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "google_forward_error";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "google_forward_status";
  DROP TYPE IF EXISTS "public"."enum_form_submissions_google_forward_status";
  ALTER TABLE "forms_steps_fields" DROP COLUMN IF EXISTS "google_entry_id";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "google_form_url";
  `)
}
