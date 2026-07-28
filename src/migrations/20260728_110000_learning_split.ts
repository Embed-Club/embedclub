import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 2 of the 2026-07-28 admin cleanup.
 *
 * - Tutorials become their own collection instead of a `type` select on
 *   Resources. Same document shape, so the DDL mirrors `resources_*`.
 * - Resources loses the dead `featured` checkbox (it was never rendered) and
 *   the hand-set `last_updated` date — "last updated" now reads Payload's own
 *   `updated_at`, which cannot go stale.
 * - Simulators loses `category`, gains `video_url` for the modal walkthrough,
 *   and `iframe_url` becomes `launch_url` (simulators open on their own site,
 *   they are not embedded).
 * - Resources, Tutorials, and Simulators become `orderable`, which is the
 *   `_order` fractional-index column Payload's drag-to-reorder list view writes.
 *
 * Pure DDL: `resources` had no rows when this was written, so there is no
 * tutorial content to move across.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_tutorials_blocks_code_block_language" AS ENUM('javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'yaml', 'json', 'markdown', 'xml');
  CREATE TYPE "public"."enum_tutorials_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  CREATE TYPE "public"."enum_tutorials_blocks_image_block_size" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "public"."enum_tutorials_blocks_row_block_columns" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_tutorials_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_tutorials_badge" AS ENUM('featured', 'popular', 'essential');

  CREATE TABLE "tutorials_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_code_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_tutorials_blocks_code_block_language" NOT NULL,
  	"code" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_table_block_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header" varchar NOT NULL
  );

  CREATE TABLE "tutorials_blocks_table_block_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cell" varchar NOT NULL
  );

  CREATE TABLE "tutorials_blocks_table_block_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "tutorials_blocks_table_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_graph_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"graph_type" "enum_tutorials_blocks_graph_block_graph_type" NOT NULL,
  	"mermaid_definition" varchar,
  	"chart_data" jsonb,
  	"html" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_image_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"size" "enum_tutorials_blocks_image_block_size" DEFAULT 'large',
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_simulator_link_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"simulator_id" integer NOT NULL,
  	"button_text" varchar DEFAULT 'Launch Simulator',
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_row_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "enum_tutorials_blocks_row_block_columns" DEFAULT '2' NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"difficulty" "enum_tutorials_difficulty" DEFAULT 'beginner' NOT NULL,
  	"estimated_read_time" numeric,
  	"badge" "enum_tutorials_badge",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "tutorials_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );

  ALTER TABLE "tutorials_blocks_text_block" ADD CONSTRAINT "tutorials_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_code_block" ADD CONSTRAINT "tutorials_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_table_block_headers" ADD CONSTRAINT "tutorials_blocks_table_block_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_table_block_rows_cells" ADD CONSTRAINT "tutorials_blocks_table_block_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials_blocks_table_block_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_table_block_rows" ADD CONSTRAINT "tutorials_blocks_table_block_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_table_block" ADD CONSTRAINT "tutorials_blocks_table_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_graph_block" ADD CONSTRAINT "tutorials_blocks_graph_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_image_block" ADD CONSTRAINT "tutorials_blocks_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_image_block" ADD CONSTRAINT "tutorials_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_simulator_link_block" ADD CONSTRAINT "tutorials_blocks_simulator_link_block_simulator_id_simulators_id_fk" FOREIGN KEY ("simulator_id") REFERENCES "public"."simulators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_simulator_link_block" ADD CONSTRAINT "tutorials_blocks_simulator_link_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_row_block" ADD CONSTRAINT "tutorials_blocks_row_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials" ADD CONSTRAINT "tutorials_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tutorials_rels" ADD CONSTRAINT "tutorials_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_rels" ADD CONSTRAINT "tutorials_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "tutorials_blocks_text_block_order_idx" ON "tutorials_blocks_text_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_text_block_parent_id_idx" ON "tutorials_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_text_block_path_idx" ON "tutorials_blocks_text_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_code_block_order_idx" ON "tutorials_blocks_code_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_code_block_parent_id_idx" ON "tutorials_blocks_code_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_code_block_path_idx" ON "tutorials_blocks_code_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_table_block_headers_order_idx" ON "tutorials_blocks_table_block_headers" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_table_block_headers_parent_id_idx" ON "tutorials_blocks_table_block_headers" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_table_block_rows_cells_order_idx" ON "tutorials_blocks_table_block_rows_cells" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_table_block_rows_cells_parent_id_idx" ON "tutorials_blocks_table_block_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_table_block_rows_order_idx" ON "tutorials_blocks_table_block_rows" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_table_block_rows_parent_id_idx" ON "tutorials_blocks_table_block_rows" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_table_block_order_idx" ON "tutorials_blocks_table_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_table_block_parent_id_idx" ON "tutorials_blocks_table_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_table_block_path_idx" ON "tutorials_blocks_table_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_graph_block_order_idx" ON "tutorials_blocks_graph_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_graph_block_parent_id_idx" ON "tutorials_blocks_graph_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_graph_block_path_idx" ON "tutorials_blocks_graph_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_image_block_order_idx" ON "tutorials_blocks_image_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_image_block_parent_id_idx" ON "tutorials_blocks_image_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_image_block_path_idx" ON "tutorials_blocks_image_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_image_block_image_idx" ON "tutorials_blocks_image_block" USING btree ("image_id");
  CREATE INDEX "tutorials_blocks_simulator_link_block_order_idx" ON "tutorials_blocks_simulator_link_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_simulator_link_block_parent_id_idx" ON "tutorials_blocks_simulator_link_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_simulator_link_block_path_idx" ON "tutorials_blocks_simulator_link_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_simulator_link_block_simulator_idx" ON "tutorials_blocks_simulator_link_block" USING btree ("simulator_id");
  CREATE INDEX "tutorials_blocks_row_block_order_idx" ON "tutorials_blocks_row_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_row_block_parent_id_idx" ON "tutorials_blocks_row_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_row_block_path_idx" ON "tutorials_blocks_row_block" USING btree ("_path");
  CREATE INDEX "tutorials_order_idx" ON "tutorials" USING btree ("_order");
  CREATE UNIQUE INDEX "tutorials_slug_idx" ON "tutorials" USING btree ("slug");
  CREATE INDEX "tutorials_thumbnail_idx" ON "tutorials" USING btree ("thumbnail_id");
  CREATE INDEX "tutorials_updated_at_idx" ON "tutorials" USING btree ("updated_at");
  CREATE INDEX "tutorials_created_at_idx" ON "tutorials" USING btree ("created_at");
  CREATE INDEX "tutorials_rels_order_idx" ON "tutorials_rels" USING btree ("order");
  CREATE INDEX "tutorials_rels_parent_idx" ON "tutorials_rels" USING btree ("parent_id");
  CREATE INDEX "tutorials_rels_path_idx" ON "tutorials_rels" USING btree ("path");
  CREATE INDEX "tutorials_rels_tags_id_idx" ON "tutorials_rels" USING btree ("tags_id");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tutorials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tutorials_fk" FOREIGN KEY ("tutorials_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_tutorials_id_idx" ON "payload_locked_documents_rels" USING btree ("tutorials_id");

  -- Resources: drop the dead checkbox, the hand-set date, and the type split
  ALTER TABLE "resources" DROP COLUMN IF EXISTS "featured";
  ALTER TABLE "resources" DROP COLUMN IF EXISTS "last_updated";
  ALTER TABLE "resources" DROP COLUMN IF EXISTS "type";
  DROP TYPE IF EXISTS "public"."enum_resources_type";
  ALTER TABLE "resources" ADD COLUMN "_order" varchar;
  CREATE INDEX "resources_order_idx" ON "resources" USING btree ("_order");

  -- Simulators: no category, launch externally, optional walkthrough video
  ALTER TABLE "simulators" DROP COLUMN IF EXISTS "category";
  DROP TYPE IF EXISTS "public"."enum_simulators_category";
  ALTER TABLE "simulators" RENAME COLUMN "iframe_url" TO "launch_url";
  ALTER TABLE "simulators" ADD COLUMN "video_url" varchar;
  ALTER TABLE "simulators" ADD COLUMN "_order" varchar;
  CREATE INDEX "simulators_order_idx" ON "simulators" USING btree ("_order");

  -- Seed the fractional-index keys Payload's drag-to-reorder expects. 'a0' is
  -- the first key generateKeyBetween(null, null) produces; subsequent rows step
  -- through the same base62 digit alphabet.
  UPDATE "resources" SET "_order" = 'a' || substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', (row_number)::int, 1)
    FROM (SELECT "id", row_number() OVER (ORDER BY "created_at") AS row_number FROM "resources") AS ordered
    WHERE "resources"."id" = ordered."id" AND ordered.row_number <= 62;
  UPDATE "simulators" SET "_order" = 'a' || substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', (row_number)::int, 1)
    FROM (SELECT "id", row_number() OVER (ORDER BY "created_at") AS row_number FROM "simulators") AS ordered
    WHERE "simulators"."id" = ordered."id" AND ordered.row_number <= 62;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "simulators_order_idx";
  ALTER TABLE "simulators" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "simulators" DROP COLUMN IF EXISTS "video_url";
  ALTER TABLE "simulators" RENAME COLUMN "launch_url" TO "iframe_url";
  CREATE TYPE "public"."enum_simulators_category" AS ENUM('microcontrollers', 'protocols', 'rtos', 'peripherals', 'architecture');
  ALTER TABLE "simulators" ADD COLUMN "category" "enum_simulators_category";

  DROP INDEX IF EXISTS "resources_order_idx";
  ALTER TABLE "resources" DROP COLUMN IF EXISTS "_order";
  CREATE TYPE "public"."enum_resources_type" AS ENUM('resource', 'tutorial');
  ALTER TABLE "resources" ADD COLUMN "type" "enum_resources_type" DEFAULT 'resource' NOT NULL;
  ALTER TABLE "resources" ADD COLUMN "last_updated" timestamp(3) with time zone;
  ALTER TABLE "resources" ADD COLUMN "featured" boolean DEFAULT false;

  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tutorials_id";

  DROP TABLE IF EXISTS "tutorials_blocks_text_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_code_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_table_block_headers" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_table_block_rows_cells" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_table_block_rows" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_table_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_graph_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_image_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_simulator_link_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_row_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_rels" CASCADE;
  DROP TABLE IF EXISTS "tutorials" CASCADE;

  DROP TYPE IF EXISTS "public"."enum_tutorials_blocks_code_block_language";
  DROP TYPE IF EXISTS "public"."enum_tutorials_blocks_graph_block_graph_type";
  DROP TYPE IF EXISTS "public"."enum_tutorials_blocks_image_block_size";
  DROP TYPE IF EXISTS "public"."enum_tutorials_blocks_row_block_columns";
  DROP TYPE IF EXISTS "public"."enum_tutorials_difficulty";
  DROP TYPE IF EXISTS "public"."enum_tutorials_badge";`)
}
