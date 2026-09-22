import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the Build Targets collection - boards programmable from the Build page.
 * Same shape as Simulators minus the content blocks: the editor is a React
 * component chosen by the `editor` enum, and `notes` is a single rich-text
 * field for setup tips.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_build_targets_editor" AS ENUM('microbitPython');
  CREATE TYPE "public"."enum_build_targets_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');

  CREATE TABLE "build_targets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"editor" "enum_build_targets_editor" DEFAULT 'microbitPython' NOT NULL,
  	"difficulty" "enum_build_targets_difficulty" DEFAULT 'beginner',
  	"notes" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "build_targets_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );

  ALTER TABLE "build_targets" ADD CONSTRAINT "build_targets_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "build_targets_rels" ADD CONSTRAINT "build_targets_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."build_targets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "build_targets_rels" ADD CONSTRAINT "build_targets_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "build_targets_order_idx" ON "build_targets" USING btree ("_order");
  CREATE UNIQUE INDEX "build_targets_slug_idx" ON "build_targets" USING btree ("slug");
  CREATE INDEX "build_targets_thumbnail_idx" ON "build_targets" USING btree ("thumbnail_id");
  CREATE INDEX "build_targets_updated_at_idx" ON "build_targets" USING btree ("updated_at");
  CREATE INDEX "build_targets_created_at_idx" ON "build_targets" USING btree ("created_at");
  CREATE INDEX "build_targets_rels_order_idx" ON "build_targets_rels" USING btree ("order");
  CREATE INDEX "build_targets_rels_parent_idx" ON "build_targets_rels" USING btree ("parent_id");
  CREATE INDEX "build_targets_rels_path_idx" ON "build_targets_rels" USING btree ("path");
  CREATE INDEX "build_targets_rels_tags_id_idx" ON "build_targets_rels" USING btree ("tags_id");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "build_targets_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_build_targets_fk" FOREIGN KEY ("build_targets_id") REFERENCES "public"."build_targets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_build_targets_id_idx" ON "payload_locked_documents_rels" USING btree ("build_targets_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "build_targets_id";

  DROP TABLE IF EXISTS "build_targets_rels" CASCADE;
  DROP TABLE IF EXISTS "build_targets" CASCADE;

  DROP TYPE IF EXISTS "public"."enum_build_targets_editor";
  DROP TYPE IF EXISTS "public"."enum_build_targets_difficulty";`)
}
