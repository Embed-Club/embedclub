import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"privacy_title" varchar DEFAULT 'Privacy Policy' NOT NULL,
  	"privacy" jsonb,
  	"terms_title" varchar DEFAULT 'Terms & Conditions' NOT NULL,
  	"terms" jsonb,
  	"consent_notice" varchar,
  	"last_updated" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "form_submissions" ADD COLUMN "consent_accepted_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "legal_pages" CASCADE;
  ALTER TABLE "form_submissions" DROP COLUMN "consent_accepted_at";`)
}
