import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN "google_form_id" varchar;
  ALTER TABLE "form_submissions" ADD COLUMN "google_response_id" varchar;
  CREATE INDEX "forms_google_form_id_idx" ON "forms" USING btree ("google_form_id");
  CREATE INDEX "form_submissions_google_response_id_idx" ON "form_submissions" USING btree ("google_response_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "forms_google_form_id_idx";
  DROP INDEX "form_submissions_google_response_id_idx";
  ALTER TABLE "forms" DROP COLUMN "google_form_id";
  ALTER TABLE "form_submissions" DROP COLUMN "google_response_id";`)
}
