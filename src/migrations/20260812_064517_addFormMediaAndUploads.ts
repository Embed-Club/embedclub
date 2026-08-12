import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE 'imageUpload';
  ALTER TYPE "public"."enum_forms_steps_fields_field_type" ADD VALUE 'image';
  CREATE TABLE "form_submissions_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"field_id" varchar,
  	"drive_file_id" varchar,
  	"file_name" varchar,
  	"mime_type" varchar
  );
  
  CREATE TABLE "form_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_inline_url" varchar,
  	"sizes_inline_width" numeric,
  	"sizes_inline_height" numeric,
  	"sizes_inline_mime_type" varchar,
  	"sizes_inline_filesize" numeric,
  	"sizes_inline_filename" varchar
  );
  
  ALTER TABLE "forms_steps_fields" ADD COLUMN "image_id" integer;
  ALTER TABLE "forms_steps_fields" ADD COLUMN "display_image_id" integer;
  ALTER TABLE "forms_steps" ADD COLUMN "step_image_id" integer;
  ALTER TABLE "forms" ADD COLUMN "header_image_id" integer;
  ALTER TABLE "forms" ADD COLUMN "drive_folder_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "form_media_id" integer;
  ALTER TABLE "form_submissions_attachments" ADD CONSTRAINT "form_submissions_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "form_submissions_attachments_order_idx" ON "form_submissions_attachments" USING btree ("_order");
  CREATE INDEX "form_submissions_attachments_parent_id_idx" ON "form_submissions_attachments" USING btree ("_parent_id");
  CREATE INDEX "form_media_updated_at_idx" ON "form_media" USING btree ("updated_at");
  CREATE INDEX "form_media_created_at_idx" ON "form_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "form_media_filename_idx" ON "form_media" USING btree ("filename");
  CREATE INDEX "form_media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "form_media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "form_media_sizes_inline_sizes_inline_filename_idx" ON "form_media" USING btree ("sizes_inline_filename");
  ALTER TABLE "forms_steps_fields" ADD CONSTRAINT "forms_steps_fields_image_id_form_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."form_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forms_steps_fields" ADD CONSTRAINT "forms_steps_fields_display_image_id_form_media_id_fk" FOREIGN KEY ("display_image_id") REFERENCES "public"."form_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forms_steps" ADD CONSTRAINT "forms_steps_step_image_id_form_media_id_fk" FOREIGN KEY ("step_image_id") REFERENCES "public"."form_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_header_image_id_form_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."form_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_media_fk" FOREIGN KEY ("form_media_id") REFERENCES "public"."form_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "forms_steps_fields_image_idx" ON "forms_steps_fields" USING btree ("image_id");
  CREATE INDEX "forms_steps_fields_display_image_idx" ON "forms_steps_fields" USING btree ("display_image_id");
  CREATE INDEX "forms_steps_step_image_idx" ON "forms_steps" USING btree ("step_image_id");
  CREATE INDEX "forms_header_image_idx" ON "forms" USING btree ("header_image_id");
  CREATE INDEX "payload_locked_documents_rels_form_media_id_idx" ON "payload_locked_documents_rels" USING btree ("form_media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "form_submissions_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "form_submissions_attachments" CASCADE;
  DROP TABLE "form_media" CASCADE;
  ALTER TABLE "forms_steps_fields" DROP CONSTRAINT "forms_steps_fields_image_id_form_media_id_fk";
  
  ALTER TABLE "forms_steps_fields" DROP CONSTRAINT "forms_steps_fields_display_image_id_form_media_id_fk";
  
  ALTER TABLE "forms_steps" DROP CONSTRAINT "forms_steps_step_image_id_form_media_id_fk";
  
  ALTER TABLE "forms" DROP CONSTRAINT "forms_header_image_id_form_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_form_media_fk";
  
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "field_type" SET DATA TYPE text;
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "field_type" SET DEFAULT 'text'::text;
  DROP TYPE "public"."enum_forms_steps_fields_field_type";
  CREATE TYPE "public"."enum_forms_steps_fields_field_type" AS ENUM('text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date');
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "field_type" SET DEFAULT 'text'::"public"."enum_forms_steps_fields_field_type";
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "field_type" SET DATA TYPE "public"."enum_forms_steps_fields_field_type" USING "field_type"::"public"."enum_forms_steps_fields_field_type";
  DROP INDEX "forms_steps_fields_image_idx";
  DROP INDEX "forms_steps_fields_display_image_idx";
  DROP INDEX "forms_steps_step_image_idx";
  DROP INDEX "forms_header_image_idx";
  DROP INDEX "payload_locked_documents_rels_form_media_id_idx";
  ALTER TABLE "forms_steps_fields" DROP COLUMN "image_id";
  ALTER TABLE "forms_steps_fields" DROP COLUMN "display_image_id";
  ALTER TABLE "forms_steps" DROP COLUMN "step_image_id";
  ALTER TABLE "forms" DROP COLUMN "header_image_id";
  ALTER TABLE "forms" DROP COLUMN "drive_folder_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "form_media_id";`)
}
