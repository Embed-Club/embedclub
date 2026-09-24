import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Two things, both additive:
 *
 * 1. Google Forms parity for questions - linear scale, rating, grids, time,
 *    title-and-description and video items, "Other", shuffled options,
 *    response validation, and go-to-page branching on options and pages.
 *
 * 2. Certificates become their own collection, linked to a form. The one form
 *    that had a certificate set up is copied across, with its placeholders and
 *    batches.
 *
 * The old `forms.certificate_*` columns and `forms_certificate_*` tables are
 * deliberately left in place. This runs against the shared database before the
 * code that stops reading them is deployed, and dropping them first would break
 * the live site's form pages in between. A later migration removes them.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'linearScale';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'rating';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'radioGrid';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'checkboxGrid';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'time';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'sectionText';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE IF NOT EXISTS 'video';

  CREATE TYPE "public"."enum_forms_steps_fields_validation_type" AS ENUM('none', 'numberBetween', 'minLength', 'maxLength', 'pattern');

  ALTER TABLE "forms" ADD COLUMN "show_progress_bar" boolean DEFAULT true;
  ALTER TABLE "forms" ADD COLUMN "allow_another_response" boolean DEFAULT false;
  ALTER TABLE "forms_steps" ADD COLUMN "after_step" numeric;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "video_url" varchar;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "scale_min" numeric DEFAULT 1;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "scale_max" numeric DEFAULT 5;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "scale_min_label" varchar;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "scale_max_label" varchar;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "rating_max" numeric DEFAULT 5;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "allow_other" boolean DEFAULT false;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "shuffle_options" boolean DEFAULT false;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "branching" boolean DEFAULT false;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "validation_type" "enum_forms_steps_fields_validation_type" DEFAULT 'none';
  ALTER TABLE "forms_steps_fields" ADD COLUMN "validation_min" numeric;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "validation_max" numeric;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "validation_pattern" varchar;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "validation_message" varchar;
  ALTER TABLE "forms_steps_fields_options" ADD COLUMN "go_to_page" numeric;

  CREATE TABLE "forms_steps_fields_grid_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"row" varchar NOT NULL
  );

  CREATE TABLE "forms_steps_fields_grid_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"column" varchar NOT NULL
  );

  ALTER TABLE "forms_steps_fields_grid_rows" ADD CONSTRAINT "forms_steps_fields_grid_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_steps_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_steps_fields_grid_columns" ADD CONSTRAINT "forms_steps_fields_grid_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_steps_fields"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "forms_steps_fields_grid_rows_order_idx" ON "forms_steps_fields_grid_rows" USING btree ("_order");
  CREATE INDEX "forms_steps_fields_grid_rows_parent_id_idx" ON "forms_steps_fields_grid_rows" USING btree ("_parent_id");
  CREATE INDEX "forms_steps_fields_grid_columns_order_idx" ON "forms_steps_fields_grid_columns" USING btree ("_order");
  CREATE INDEX "forms_steps_fields_grid_columns_parent_id_idx" ON "forms_steps_fields_grid_columns" USING btree ("_parent_id");

  CREATE TYPE "public"."enum_certificates_delivery" AS ENUM('immediate', 'scheduled');
  CREATE TYPE "public"."enum_certificates_name_case" AS ENUM('asTyped', 'upper', 'title');
  CREATE TYPE "public"."enum_certificates_email_name_case" AS ENUM('asTyped', 'upper', 'title');
  CREATE TYPE "public"."enum_certificates_placeholders_source" AS ENUM('question', 'fixed', 'perPerson');

  CREATE TABLE "certificates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"title" varchar,
  	"enabled" boolean DEFAULT true,
  	"event_name" varchar,
  	"template_drive_id" varchar,
  	"delivery" "enum_certificates_delivery" DEFAULT 'immediate',
  	"send_at" timestamp(3) with time zone,
  	"name_case" "enum_certificates_name_case" DEFAULT 'asTyped',
  	"email_name_case" "enum_certificates_email_name_case" DEFAULT 'asTyped',
  	"email_subject" varchar,
  	"email_body" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "certificates_placeholders" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"source" "enum_certificates_placeholders_source" DEFAULT 'question' NOT NULL,
  	"question_label" varchar,
  	"fixed_value" varchar,
  	"default_value" varchar
  );

  CREATE TABLE "certificates_batches" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"match_field" varchar NOT NULL,
  	"match_value" varchar NOT NULL,
  	"send_at" timestamp(3) with time zone NOT NULL
  );

  ALTER TABLE "certificates" ADD CONSTRAINT "certificates_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "certificates_placeholders" ADD CONSTRAINT "certificates_placeholders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "certificates_batches" ADD CONSTRAINT "certificates_batches_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "certificates_form_idx" ON "certificates" USING btree ("form_id");
  CREATE INDEX "certificates_updated_at_idx" ON "certificates" USING btree ("updated_at");
  CREATE INDEX "certificates_created_at_idx" ON "certificates" USING btree ("created_at");
  CREATE INDEX "certificates_placeholders_order_idx" ON "certificates_placeholders" USING btree ("_order");
  CREATE INDEX "certificates_placeholders_parent_id_idx" ON "certificates_placeholders" USING btree ("_parent_id");
  CREATE INDEX "certificates_batches_order_idx" ON "certificates_batches" USING btree ("_order");
  CREATE INDEX "certificates_batches_parent_id_idx" ON "certificates_batches" USING btree ("_parent_id");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "certificates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certificates_fk" FOREIGN KEY ("certificates_id") REFERENCES "public"."certificates"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_certificates_id_idx" ON "payload_locked_documents_rels" USING btree ("certificates_id");

  INSERT INTO "certificates" ("form_id", "title", "enabled", "template_drive_id", "delivery", "send_at", "name_case", "email_name_case", "email_subject", "email_body")
  SELECT "id", "title" || ' - Certificate', true, "certificate_template_drive_id",
    COALESCE("certificate_delivery"::text, 'immediate')::"enum_certificates_delivery",
    "certificate_send_at",
    COALESCE("certificate_name_case"::text, 'asTyped')::"enum_certificates_name_case",
    COALESCE("certificate_email_name_case"::text, 'asTyped')::"enum_certificates_email_name_case",
    "certificate_email_subject", "certificate_email_body"
  FROM "forms"
  WHERE "show_certificate" = true AND "section_of_id" IS NULL;

  INSERT INTO "certificates_placeholders" ("_order", "_parent_id", "id", "key", "source", "question_label", "fixed_value", "default_value")
  SELECT p."_order", c."id", p."id", COALESCE(p."key", ''),
    COALESCE(p."source"::text, 'question')::"enum_certificates_placeholders_source",
    p."question_label", p."fixed_value", p."default_value"
  FROM "forms_certificate_placeholders" p
  JOIN "certificates" c ON c."form_id" = p."_parent_id";

  INSERT INTO "certificates_batches" ("_order", "_parent_id", "id", "label", "match_field", "match_value", "send_at")
  SELECT b."_order", c."id", b."id", b."label", b."match_field", b."match_value", b."send_at"
  FROM "forms_certificate_batches" b
  JOIN "certificates" c ON c."form_id" = b."_parent_id";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "certificates_id";
  DROP TABLE IF EXISTS "certificates_batches" CASCADE;
  DROP TABLE IF EXISTS "certificates_placeholders" CASCADE;
  DROP TABLE IF EXISTS "certificates" CASCADE;
  DROP TYPE IF EXISTS "public"."enum_certificates_placeholders_source";
  DROP TYPE IF EXISTS "public"."enum_certificates_email_name_case";
  DROP TYPE IF EXISTS "public"."enum_certificates_name_case";
  DROP TYPE IF EXISTS "public"."enum_certificates_delivery";
  DROP TABLE IF EXISTS "forms_steps_fields_grid_columns" CASCADE;
  DROP TABLE IF EXISTS "forms_steps_fields_grid_rows" CASCADE;
  ALTER TABLE "forms_steps_fields_options" DROP COLUMN IF EXISTS "go_to_page";
  ALTER TABLE "forms_steps_fields" DROP COLUMN IF EXISTS "video_url", DROP COLUMN IF EXISTS "scale_min",
    DROP COLUMN IF EXISTS "scale_max", DROP COLUMN IF EXISTS "scale_min_label", DROP COLUMN IF EXISTS "scale_max_label",
    DROP COLUMN IF EXISTS "rating_max", DROP COLUMN IF EXISTS "allow_other", DROP COLUMN IF EXISTS "shuffle_options",
    DROP COLUMN IF EXISTS "branching", DROP COLUMN IF EXISTS "validation_type", DROP COLUMN IF EXISTS "validation_min",
    DROP COLUMN IF EXISTS "validation_max", DROP COLUMN IF EXISTS "validation_pattern", DROP COLUMN IF EXISTS "validation_message";
  DROP TYPE IF EXISTS "public"."enum_forms_steps_fields_validation_type";
  ALTER TABLE "forms_steps" DROP COLUMN IF EXISTS "after_step";
  ALTER TABLE "forms" DROP COLUMN IF EXISTS "show_progress_bar", DROP COLUMN IF EXISTS "allow_another_response";`)
}
