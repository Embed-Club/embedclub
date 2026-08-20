import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

/**
 * Forms stop mirroring a Google Form and become the real thing.
 *
 * - `google_form_url` and the per-field `google_entry_id` go. Copying entry IDs
 *   by hand was the most error-prone step a member had, and Google answers
 *   200 even when they are wrong, so a typo silently sent responses nowhere.
 * - Fields gain a `role` (none / name / email) so certificates know what to
 *   print and where to send it, plus optional `help_text`.
 * - The event↔form link flips direction: `events.registration_form_id` is
 *   dropped in favour of `forms.related_event_id`, because an event exists long
 *   before its forms do. Events surface theirs through a virtual join field,
 *   which needs no column.
 * - Submissions gain the submitter's name/email (extracted via the roles) and
 *   certificate delivery state, replacing the meaningless
 *   `google_forward_status`.
 * - The `feedback_page` global is dropped; Feedback is now just the Forms
 *   listing filtered to `type = 'feedback'`.
 *
 * Safe to run as pure DDL: forms, form fields, form submissions and the
 * feedback_page global were all empty, and no event referenced a form.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_forms_steps_fields_role" AS ENUM('none', 'name', 'email');
  CREATE TYPE "public"."enum_forms_certificate_delivery" AS ENUM('immediate', 'scheduled');
  CREATE TYPE "public"."enum_form_submissions_certificate_status" AS ENUM('notApplicable', 'pending', 'sent', 'failed');

  -- Fields: roles + help text, no more Google entry IDs
  ALTER TABLE "forms_steps_fields" ADD COLUMN "role" "enum_forms_steps_fields_role" DEFAULT 'none';
  ALTER TABLE "forms_steps_fields" ADD COLUMN "help_text" varchar;
  ALTER TABLE "forms_steps_fields" DROP COLUMN IF EXISTS "google_entry_id";

  -- Forms: no Google URL, linked to an event, certificate delivery mode
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "google_form_url";
  ALTER TABLE "forms" ADD COLUMN "related_event_id" integer;
  ALTER TABLE "forms" ADD COLUMN "certificate_delivery" "enum_forms_certificate_delivery" DEFAULT 'immediate';
  ALTER TABLE "forms" ADD COLUMN "certificate_send_at" timestamp(3) with time zone;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_related_event_id_events_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "forms_related_event_idx" ON "forms" USING btree ("related_event_id");

  -- The event → form pointer is replaced by the form → event one above
  ALTER TABLE "events" DROP COLUMN IF EXISTS "registration_form_id";

  -- Submissions: who submitted, and certificate delivery state
  ALTER TABLE "form_submissions" ADD COLUMN "submitter_name" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN "submitter_email" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN "answers_by_label" jsonb;
  ALTER TABLE "form_submissions" ADD COLUMN "certificate_status" "enum_form_submissions_certificate_status" DEFAULT 'notApplicable' NOT NULL;
  ALTER TABLE "form_submissions" ADD COLUMN "certificate_sent_at" timestamp(3) with time zone;
  ALTER TABLE "form_submissions" ADD COLUMN "certificate_error" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN "sheet_synced_at" timestamp(3) with time zone;
  CREATE INDEX "form_submissions_sheet_synced_at_idx" ON "form_submissions" USING btree ("sheet_synced_at");
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "google_forward_status";
  DROP TYPE IF EXISTS "public"."enum_form_submissions_google_forward_status";

  CREATE INDEX "form_submissions_submitter_name_idx" ON "form_submissions" USING btree ("submitter_name");
  CREATE INDEX "form_submissions_submitter_email_idx" ON "form_submissions" USING btree ("submitter_email");
  CREATE INDEX "form_submissions_certificate_status_idx" ON "form_submissions" USING btree ("certificate_status");

  -- Feedback is now the Forms listing filtered by type
  DROP TABLE IF EXISTS "feedback_page" CASCADE;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "feedback_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Feedback' NOT NULL,
  	"intro" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  DROP INDEX IF EXISTS "form_submissions_submitter_name_idx";
  DROP INDEX IF EXISTS "form_submissions_submitter_email_idx";
  DROP INDEX IF EXISTS "form_submissions_certificate_status_idx";
  DROP INDEX IF EXISTS "form_submissions_sheet_synced_at_idx";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "sheet_synced_at";

  CREATE TYPE "public"."enum_form_submissions_google_forward_status" AS ENUM('forwarded', 'failed', 'pending');
  ALTER TABLE "form_submissions" ADD COLUMN "google_forward_status" "enum_form_submissions_google_forward_status" DEFAULT 'pending' NOT NULL;
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "certificate_error";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "certificate_sent_at";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "certificate_status";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "answers_by_label";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "submitter_email";
  ALTER TABLE "form_submissions" DROP COLUMN IF EXISTS "submitter_name";

  ALTER TABLE "events" ADD COLUMN "registration_form_id" integer;
  ALTER TABLE "events" ADD CONSTRAINT "events_registration_form_id_forms_id_fk" FOREIGN KEY ("registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_registration_form_idx" ON "events" USING btree ("registration_form_id");

  DROP INDEX IF EXISTS "forms_related_event_idx";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_send_at";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "certificate_delivery";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "related_event_id";
  ALTER TABLE "forms" ADD COLUMN "google_form_url" varchar NOT NULL DEFAULT '';

  ALTER TABLE "forms_steps_fields" ADD COLUMN "google_entry_id" varchar NOT NULL DEFAULT '';
  ALTER TABLE "forms_steps_fields" DROP COLUMN IF EXISTS "help_text";
  ALTER TABLE "forms_steps_fields" DROP COLUMN IF EXISTS "role";

  DROP TYPE IF EXISTS "public"."enum_form_submissions_certificate_status";
  DROP TYPE IF EXISTS "public"."enum_forms_certificate_delivery";
  DROP TYPE IF EXISTS "public"."enum_forms_steps_fields_role";`);
}
