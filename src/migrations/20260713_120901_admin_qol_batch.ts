import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_event_mode" AS ENUM('inPerson', 'online');
  CREATE TYPE "public"."enum_exports_format" AS ENUM('csv', 'json');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_exports_drafts" AS ENUM('yes', 'no');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_about_page_blocks_about_image_block_position" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum_about_page_blocks_about_image_block_size" AS ENUM('small', 'medium', 'large');
  CREATE TABLE "members_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"member_roles_id" integer
  );
  
  CREATE TABLE "gallery_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"format" "enum_exports_format" DEFAULT 'csv' NOT NULL,
  	"limit" numeric,
  	"page" numeric DEFAULT 1,
  	"sort" varchar,
  	"sort_order" "enum_exports_sort_order",
  	"drafts" "enum_exports_drafts" DEFAULT 'yes',
  	"collection_slug" varchar DEFAULT 'members' NOT NULL,
  	"where" jsonb DEFAULT '{}'::jsonb,
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
  	"focal_y" numeric
  );
  
  CREATE TABLE "exports_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar DEFAULT 'members' NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
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
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "about_page_blocks_banner_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"background_image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "about_page_blocks_about_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "about_page_blocks_about_image_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"position" "enum_about_page_blocks_about_image_block_position" DEFAULT 'center',
  	"size" "enum_about_page_blocks_about_image_block_size" DEFAULT 'large',
  	"block_name" varchar
  );
  
  ALTER TABLE "members" DROP CONSTRAINT "members_roles_id_member_roles_id_fk";
  
  DROP INDEX "members_roles_idx";
  DROP INDEX "gallery_filename_idx";
  DROP INDEX "gallery_sizes_thumbnail_sizes_thumbnail_filename_idx";
  DROP INDEX "gallery_sizes_card_sizes_card_filename_idx";
  ALTER TABLE "events" ADD COLUMN "event_date" timestamp(3) with time zone;
  UPDATE "events" SET "event_date" = "created_at" WHERE "event_date" IS NULL;
  ALTER TABLE "events" ALTER COLUMN "event_date" SET NOT NULL;
  ALTER TABLE "events" ADD COLUMN "event_mode" "enum_events_event_mode" DEFAULT 'inPerson' NOT NULL;
  ALTER TABLE "events" ADD COLUMN "meeting_link" varchar;
  ALTER TABLE "members_rels" ADD CONSTRAINT "members_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_rels" ADD CONSTRAINT "members_rels_member_roles_fk" FOREIGN KEY ("member_roles_id") REFERENCES "public"."member_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_rels" ADD CONSTRAINT "gallery_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gallery_rels" ADD CONSTRAINT "gallery_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "exports_texts" ADD CONSTRAINT "exports_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_blocks_banner_block" ADD CONSTRAINT "about_page_blocks_banner_block_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_blocks_banner_block" ADD CONSTRAINT "about_page_blocks_banner_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_blocks_about_text_block" ADD CONSTRAINT "about_page_blocks_about_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_blocks_about_image_block" ADD CONSTRAINT "about_page_blocks_about_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_blocks_about_image_block" ADD CONSTRAINT "about_page_blocks_about_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "members_rels_order_idx" ON "members_rels" USING btree ("order");
  CREATE INDEX "members_rels_parent_idx" ON "members_rels" USING btree ("parent_id");
  CREATE INDEX "members_rels_path_idx" ON "members_rels" USING btree ("path");
  CREATE INDEX "members_rels_member_roles_id_idx" ON "members_rels" USING btree ("member_roles_id");
  CREATE INDEX "gallery_rels_order_idx" ON "gallery_rels" USING btree ("order");
  CREATE INDEX "gallery_rels_parent_idx" ON "gallery_rels" USING btree ("parent_id");
  CREATE INDEX "gallery_rels_path_idx" ON "gallery_rels" USING btree ("path");
  CREATE INDEX "gallery_rels_media_id_idx" ON "gallery_rels" USING btree ("media_id");
  CREATE INDEX "exports_updated_at_idx" ON "exports" USING btree ("updated_at");
  CREATE INDEX "exports_created_at_idx" ON "exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "exports_filename_idx" ON "exports" USING btree ("filename");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "about_page_blocks_banner_block_order_idx" ON "about_page_blocks_banner_block" USING btree ("_order");
  CREATE INDEX "about_page_blocks_banner_block_parent_id_idx" ON "about_page_blocks_banner_block" USING btree ("_parent_id");
  CREATE INDEX "about_page_blocks_banner_block_path_idx" ON "about_page_blocks_banner_block" USING btree ("_path");
  CREATE INDEX "about_page_blocks_banner_block_background_image_idx" ON "about_page_blocks_banner_block" USING btree ("background_image_id");
  CREATE INDEX "about_page_blocks_about_text_block_order_idx" ON "about_page_blocks_about_text_block" USING btree ("_order");
  CREATE INDEX "about_page_blocks_about_text_block_parent_id_idx" ON "about_page_blocks_about_text_block" USING btree ("_parent_id");
  CREATE INDEX "about_page_blocks_about_text_block_path_idx" ON "about_page_blocks_about_text_block" USING btree ("_path");
  CREATE INDEX "about_page_blocks_about_image_block_order_idx" ON "about_page_blocks_about_image_block" USING btree ("_order");
  CREATE INDEX "about_page_blocks_about_image_block_parent_id_idx" ON "about_page_blocks_about_image_block" USING btree ("_parent_id");
  CREATE INDEX "about_page_blocks_about_image_block_path_idx" ON "about_page_blocks_about_image_block" USING btree ("_path");
  CREATE INDEX "about_page_blocks_about_image_block_image_idx" ON "about_page_blocks_about_image_block" USING btree ("image_id");
  CREATE UNIQUE INDEX "member_categories_name_idx" ON "member_categories" USING btree ("name");
  CREATE UNIQUE INDEX "member_roles_name_idx" ON "member_roles" USING btree ("name");
  INSERT INTO "members_rels" ("order", "parent_id", "path", "member_roles_id")
    SELECT 1, "id", 'roles', "roles_id" FROM "members" WHERE "roles_id" IS NOT NULL;
  ALTER TABLE "members" DROP COLUMN "roles_id";
  ALTER TABLE "gallery" DROP COLUMN "url";
  ALTER TABLE "gallery" DROP COLUMN "thumbnail_u_r_l";
  ALTER TABLE "gallery" DROP COLUMN "filename";
  ALTER TABLE "gallery" DROP COLUMN "mime_type";
  ALTER TABLE "gallery" DROP COLUMN "filesize";
  ALTER TABLE "gallery" DROP COLUMN "width";
  ALTER TABLE "gallery" DROP COLUMN "height";
  ALTER TABLE "gallery" DROP COLUMN "focal_x";
  ALTER TABLE "gallery" DROP COLUMN "focal_y";
  ALTER TABLE "gallery" DROP COLUMN "sizes_thumbnail_url";
  ALTER TABLE "gallery" DROP COLUMN "sizes_thumbnail_width";
  ALTER TABLE "gallery" DROP COLUMN "sizes_thumbnail_height";
  ALTER TABLE "gallery" DROP COLUMN "sizes_thumbnail_mime_type";
  ALTER TABLE "gallery" DROP COLUMN "sizes_thumbnail_filesize";
  ALTER TABLE "gallery" DROP COLUMN "sizes_thumbnail_filename";
  ALTER TABLE "gallery" DROP COLUMN "sizes_card_url";
  ALTER TABLE "gallery" DROP COLUMN "sizes_card_width";
  ALTER TABLE "gallery" DROP COLUMN "sizes_card_height";
  ALTER TABLE "gallery" DROP COLUMN "sizes_card_mime_type";
  ALTER TABLE "gallery" DROP COLUMN "sizes_card_filesize";
  ALTER TABLE "gallery" DROP COLUMN "sizes_card_filename";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gallery_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "exports_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "imports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_blocks_banner_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_blocks_about_text_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_page_blocks_about_image_block" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "members_rels" CASCADE;
  DROP TABLE "gallery_rels" CASCADE;
  DROP TABLE "exports" CASCADE;
  DROP TABLE "exports_texts" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "about_page_blocks_banner_block" CASCADE;
  DROP TABLE "about_page_blocks_about_text_block" CASCADE;
  DROP TABLE "about_page_blocks_about_image_block" CASCADE;
  DROP INDEX "member_categories_name_idx";
  DROP INDEX "member_roles_name_idx";
  ALTER TABLE "members" ADD COLUMN "roles_id" integer NOT NULL;
  ALTER TABLE "gallery" ADD COLUMN "url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "thumbnail_u_r_l" varchar;
  ALTER TABLE "gallery" ADD COLUMN "filename" varchar;
  ALTER TABLE "gallery" ADD COLUMN "mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "focal_x" numeric;
  ALTER TABLE "gallery" ADD COLUMN "focal_y" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "gallery" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "members" ADD CONSTRAINT "members_roles_id_member_roles_id_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."member_roles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "members_roles_idx" ON "members" USING btree ("roles_id");
  CREATE UNIQUE INDEX "gallery_filename_idx" ON "gallery" USING btree ("filename");
  CREATE INDEX "gallery_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "gallery" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "gallery_sizes_card_sizes_card_filename_idx" ON "gallery" USING btree ("sizes_card_filename");
  ALTER TABLE "events" DROP COLUMN "event_date";
  ALTER TABLE "events" DROP COLUMN "event_mode";
  ALTER TABLE "events" DROP COLUMN "meeting_link";
  DROP TYPE "public"."enum_events_event_mode";
  DROP TYPE "public"."enum_exports_format";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_exports_drafts";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_about_page_blocks_about_image_block_position";
  DROP TYPE "public"."enum_about_page_blocks_about_image_block_size";`)
}
