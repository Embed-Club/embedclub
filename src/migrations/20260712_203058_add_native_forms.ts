import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_forms_steps_fields_field_type" AS ENUM('text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date');
  CREATE TYPE "public"."enum_forms_steps_fields_width" AS ENUM('full', 'half');
  CREATE TYPE "public"."enum_forms_type" AS ENUM('registration', 'feedback', 'general');
  CREATE TYPE "public"."enum_form_submissions_google_forward_status" AS ENUM('forwarded', 'failed', 'pending');
  CREATE TABLE "forms_steps_fields_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" varchar
  );
  
  CREATE TABLE "forms_steps_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"field_type" "enum_forms_steps_fields_field_type" DEFAULT 'text' NOT NULL,
  	"required" boolean DEFAULT false,
  	"width" "enum_forms_steps_fields_width" DEFAULT 'full',
  	"placeholder" varchar,
  	"google_entry_id" varchar NOT NULL
  );
  
  CREATE TABLE "forms_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_title" varchar NOT NULL,
  	"step_description" varchar
  );
  
  CREATE TABLE "forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"type" "enum_forms_type" DEFAULT 'registration' NOT NULL,
  	"active" boolean DEFAULT true,
  	"deadline" timestamp(3) with time zone,
  	"description" varchar,
  	"google_form_url" varchar NOT NULL,
  	"confirmation_message" varchar DEFAULT 'Your response has been recorded. Thank you!',
  	"show_certificate" boolean DEFAULT false,
  	"certificate_template_id" integer,
  	"certificate_config_name_x" numeric DEFAULT 400,
  	"certificate_config_name_y" numeric DEFAULT 300,
  	"certificate_config_font_size" numeric DEFAULT 40,
  	"certificate_config_color" varchar DEFAULT '#000000',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "form_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"answers" jsonb NOT NULL,
  	"google_forward_status" "enum_form_submissions_google_forward_status" DEFAULT 'pending' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "events" ADD COLUMN "registration_form_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "forms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_submissions_id" integer;
  ALTER TABLE "forms_steps_fields_options" ADD CONSTRAINT "forms_steps_fields_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_steps_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_steps_fields" ADD CONSTRAINT "forms_steps_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_steps" ADD CONSTRAINT "forms_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_certificate_template_id_media_id_fk" FOREIGN KEY ("certificate_template_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "forms_steps_fields_options_order_idx" ON "forms_steps_fields_options" USING btree ("_order");
  CREATE INDEX "forms_steps_fields_options_parent_id_idx" ON "forms_steps_fields_options" USING btree ("_parent_id");
  CREATE INDEX "forms_steps_fields_order_idx" ON "forms_steps_fields" USING btree ("_order");
  CREATE INDEX "forms_steps_fields_parent_id_idx" ON "forms_steps_fields" USING btree ("_parent_id");
  CREATE INDEX "forms_steps_order_idx" ON "forms_steps" USING btree ("_order");
  CREATE INDEX "forms_steps_parent_id_idx" ON "forms_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "forms_slug_idx" ON "forms" USING btree ("slug");
  CREATE INDEX "forms_certificate_template_idx" ON "forms" USING btree ("certificate_template_id");
  CREATE INDEX "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE INDEX "forms_created_at_idx" ON "forms" USING btree ("created_at");
  CREATE INDEX "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");
  CREATE INDEX "form_submissions_updated_at_idx" ON "form_submissions" USING btree ("updated_at");
  CREATE INDEX "form_submissions_created_at_idx" ON "form_submissions" USING btree ("created_at");
  ALTER TABLE "events" ADD CONSTRAINT "events_registration_form_id_forms_id_fk" FOREIGN KEY ("registration_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "events_registration_form_idx" ON "events" USING btree ("registration_form_id");
  CREATE INDEX "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX "payload_locked_documents_rels_form_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("form_submissions_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "feedback_forms_id";
  DROP TABLE IF EXISTS "feedback_forms" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms_steps_fields_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_steps_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_submissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "forms_steps_fields_options" CASCADE;
  DROP TABLE "forms_steps_fields" CASCADE;
  DROP TABLE "forms_steps" CASCADE;
  DROP TABLE "forms" CASCADE;
  DROP TABLE "form_submissions" CASCADE;
  ALTER TABLE "events" DROP CONSTRAINT "events_registration_form_id_forms_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_forms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_submissions_fk";
  
  DROP INDEX "events_registration_form_idx";
  DROP INDEX "payload_locked_documents_rels_forms_id_idx";
  DROP INDEX "payload_locked_documents_rels_form_submissions_id_idx";
  ALTER TABLE "events" DROP COLUMN "registration_form_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "forms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_submissions_id";
  DROP TYPE "public"."enum_forms_steps_fields_field_type";
  DROP TYPE "public"."enum_forms_steps_fields_width";
  DROP TYPE "public"."enum_forms_type";
  DROP TYPE "public"."enum_form_submissions_google_forward_status";`)
}
