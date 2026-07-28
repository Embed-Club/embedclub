import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Drop the `audio` and `audio-files` collections. Nothing on the site ever read
 * them — the home page's background music is the static `/Home.m4a` asset in
 * `public/`, played by `components/common/backgroundAudio.tsx`. The collections
 * only added noise to the admin nav.
 *
 * DESTRUCTIVE: every stored audio config row and uploaded audio file record is
 * deleted. The uploaded blobs themselves stay in the storage bucket (Payload
 * does not clean those up on a raw table drop) and can be removed by hand.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "audio_files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "audio_id";

  DROP TABLE IF EXISTS "audio_sources" CASCADE;
  DROP TABLE IF EXISTS "audio" CASCADE;
  DROP TABLE IF EXISTS "audio_files_tags" CASCADE;
  DROP TABLE IF EXISTS "audio_files" CASCADE;

  DROP TYPE IF EXISTS "public"."enum_audio_type";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_audio_type" AS ENUM('buttonClick', 'mouseClick', 'pageChange', 'scroll', 'background', 'custom');

  CREATE TABLE "audio_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
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

  CREATE TABLE "audio_files_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );

  CREATE TABLE "audio" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"type" "enum_audio_type" NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"volume" numeric DEFAULT 0.3 NOT NULL,
  	"loop" boolean DEFAULT false,
  	"playback_rate" numeric DEFAULT 1,
  	"fade_in_ms" numeric DEFAULT 0,
  	"fade_out_ms" numeric DEFAULT 0,
  	"volume_boost" numeric DEFAULT 1,
  	"effects_echo_enabled" boolean DEFAULT false,
  	"effects_echo_delay_ms" numeric DEFAULT 180,
  	"effects_echo_feedback" numeric DEFAULT 0.35,
  	"effects_echo_mix" numeric DEFAULT 0.25,
  	"effects_ambience_enabled" boolean DEFAULT false,
  	"effects_ambience_mix" numeric DEFAULT 0.2,
  	"effects_ambience_lowpass_hz" numeric DEFAULT 8000,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "audio_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"file_id" integer,
  	"external_url" varchar,
  	"weight" numeric DEFAULT 1
  );

  ALTER TABLE "audio_files_tags" ADD CONSTRAINT "audio_files_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_file_id_audio_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."audio_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audio"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "audio_files_tags_order_idx" ON "audio_files_tags" USING btree ("_order");
  CREATE INDEX "audio_files_tags_parent_id_idx" ON "audio_files_tags" USING btree ("_parent_id");
  CREATE INDEX "audio_files_updated_at_idx" ON "audio_files" USING btree ("updated_at");
  CREATE INDEX "audio_files_created_at_idx" ON "audio_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "audio_files_filename_idx" ON "audio_files" USING btree ("filename");
  CREATE INDEX "audio_sources_order_idx" ON "audio_sources" USING btree ("_order");
  CREATE INDEX "audio_sources_parent_id_idx" ON "audio_sources" USING btree ("_parent_id");
  CREATE INDEX "audio_sources_file_idx" ON "audio_sources" USING btree ("file_id");
  CREATE INDEX "audio_updated_at_idx" ON "audio" USING btree ("updated_at");
  CREATE INDEX "audio_created_at_idx" ON "audio" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audio_files_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audio_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audio_files_fk" FOREIGN KEY ("audio_files_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audio_fk" FOREIGN KEY ("audio_id") REFERENCES "public"."audio"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_audio_files_id_idx" ON "payload_locked_documents_rels" USING btree ("audio_files_id");
  CREATE INDEX "payload_locked_documents_rels_audio_id_idx" ON "payload_locked_documents_rels" USING btree ("audio_id");`)
}
