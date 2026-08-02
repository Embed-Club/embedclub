import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the Video Block (embedded YouTube) and a draw.io option on the Graph
 * Block, across every collection that shares the content-block palette:
 * resources, tutorials, simulators, projects.
 *
 * Projects doesn't list VideoBlock at the top level in its own right — it gets
 * the table because RowBlock's nested palette includes it, and nested blocks
 * live in the same per-collection table as top-level ones, distinguished by
 * `_path`. It was added to the Projects palette too so video isn't mysteriously
 * available only inside a row.
 *
 * Hand-written rather than generated: the drizzle snapshot chain in this repo
 * ends at 20260713_120901_admin_qol_batch.json, so `migrate:create` diffs
 * against a July 13 schema and tries to re-create everything added since (and
 * drop everything removed since). The last ten migrations here are hand-written
 * for the same reason.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "resources_blocks_video_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "tutorials_blocks_video_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "simulators_blocks_video_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_video_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );

  ALTER TABLE "resources_blocks_video_block" ADD CONSTRAINT "resources_blocks_video_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tutorials_blocks_video_block" ADD CONSTRAINT "tutorials_blocks_video_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_video_block" ADD CONSTRAINT "simulators_blocks_video_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_video_block" ADD CONSTRAINT "projects_blocks_video_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "resources_blocks_video_block_order_idx" ON "resources_blocks_video_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_video_block_parent_id_idx" ON "resources_blocks_video_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_video_block_path_idx" ON "resources_blocks_video_block" USING btree ("_path");
  CREATE INDEX "tutorials_blocks_video_block_order_idx" ON "tutorials_blocks_video_block" USING btree ("_order");
  CREATE INDEX "tutorials_blocks_video_block_parent_id_idx" ON "tutorials_blocks_video_block" USING btree ("_parent_id");
  CREATE INDEX "tutorials_blocks_video_block_path_idx" ON "tutorials_blocks_video_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_video_block_order_idx" ON "simulators_blocks_video_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_video_block_parent_id_idx" ON "simulators_blocks_video_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_video_block_path_idx" ON "simulators_blocks_video_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_video_block_order_idx" ON "projects_blocks_video_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_video_block_parent_id_idx" ON "projects_blocks_video_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_video_block_path_idx" ON "projects_blocks_video_block" USING btree ("_path");

  ALTER TABLE "resources_blocks_graph_block" ADD COLUMN "drawio_url" varchar;
  ALTER TABLE "tutorials_blocks_graph_block" ADD COLUMN "drawio_url" varchar;
  ALTER TABLE "simulators_blocks_graph_block" ADD COLUMN "drawio_url" varchar;
  ALTER TABLE "projects_blocks_graph_block" ADD COLUMN "drawio_url" varchar;
  `)

  // Postgres 12+ allows ALTER TYPE ... ADD VALUE inside a transaction (which is
  // how Payload runs migrations) so long as the new value isn't *used* in that
  // same transaction — nothing here does. `BEFORE 'chartData'` keeps the stored
  // order matching the order of the select options in the admin.
  await db.execute(sql`
  ALTER TYPE "public"."enum_resources_blocks_graph_block_graph_type" ADD VALUE IF NOT EXISTS 'drawio' BEFORE 'chartData';
  ALTER TYPE "public"."enum_tutorials_blocks_graph_block_graph_type" ADD VALUE IF NOT EXISTS 'drawio' BEFORE 'chartData';
  ALTER TYPE "public"."enum_simulators_blocks_graph_block_graph_type" ADD VALUE IF NOT EXISTS 'drawio' BEFORE 'chartData';
  ALTER TYPE "public"."enum_projects_blocks_graph_block_graph_type" ADD VALUE IF NOT EXISTS 'drawio' BEFORE 'chartData';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Any graph block still set to 'drawio' would block the enum rebuild below,
  // so those rows fall back to the type they'd have had before this migration.
  await db.execute(sql`
  UPDATE "resources_blocks_graph_block" SET "graph_type" = 'mermaid' WHERE "graph_type" = 'drawio';
  UPDATE "tutorials_blocks_graph_block" SET "graph_type" = 'mermaid' WHERE "graph_type" = 'drawio';
  UPDATE "simulators_blocks_graph_block" SET "graph_type" = 'mermaid' WHERE "graph_type" = 'drawio';
  UPDATE "projects_blocks_graph_block" SET "graph_type" = 'mermaid' WHERE "graph_type" = 'drawio';
  `)

  // Postgres cannot drop a single enum value — the type is rebuilt without it
  // and the columns re-pointed. Create-then-drop like this is normal here.
  await db.execute(sql`
  ALTER TYPE "public"."enum_resources_blocks_graph_block_graph_type" RENAME TO "enum_resources_blocks_graph_block_graph_type_old";
  CREATE TYPE "public"."enum_resources_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  ALTER TABLE "resources_blocks_graph_block" ALTER COLUMN "graph_type" TYPE "public"."enum_resources_blocks_graph_block_graph_type" USING "graph_type"::text::"public"."enum_resources_blocks_graph_block_graph_type";
  DROP TYPE "public"."enum_resources_blocks_graph_block_graph_type_old";

  ALTER TYPE "public"."enum_tutorials_blocks_graph_block_graph_type" RENAME TO "enum_tutorials_blocks_graph_block_graph_type_old";
  CREATE TYPE "public"."enum_tutorials_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  ALTER TABLE "tutorials_blocks_graph_block" ALTER COLUMN "graph_type" TYPE "public"."enum_tutorials_blocks_graph_block_graph_type" USING "graph_type"::text::"public"."enum_tutorials_blocks_graph_block_graph_type";
  DROP TYPE "public"."enum_tutorials_blocks_graph_block_graph_type_old";

  ALTER TYPE "public"."enum_simulators_blocks_graph_block_graph_type" RENAME TO "enum_simulators_blocks_graph_block_graph_type_old";
  CREATE TYPE "public"."enum_simulators_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  ALTER TABLE "simulators_blocks_graph_block" ALTER COLUMN "graph_type" TYPE "public"."enum_simulators_blocks_graph_block_graph_type" USING "graph_type"::text::"public"."enum_simulators_blocks_graph_block_graph_type";
  DROP TYPE "public"."enum_simulators_blocks_graph_block_graph_type_old";

  ALTER TYPE "public"."enum_projects_blocks_graph_block_graph_type" RENAME TO "enum_projects_blocks_graph_block_graph_type_old";
  CREATE TYPE "public"."enum_projects_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  ALTER TABLE "projects_blocks_graph_block" ALTER COLUMN "graph_type" TYPE "public"."enum_projects_blocks_graph_block_graph_type" USING "graph_type"::text::"public"."enum_projects_blocks_graph_block_graph_type";
  DROP TYPE "public"."enum_projects_blocks_graph_block_graph_type_old";

  ALTER TABLE "resources_blocks_graph_block" DROP COLUMN IF EXISTS "drawio_url";
  ALTER TABLE "tutorials_blocks_graph_block" DROP COLUMN IF EXISTS "drawio_url";
  ALTER TABLE "simulators_blocks_graph_block" DROP COLUMN IF EXISTS "drawio_url";
  ALTER TABLE "projects_blocks_graph_block" DROP COLUMN IF EXISTS "drawio_url";

  DROP TABLE IF EXISTS "resources_blocks_video_block" CASCADE;
  DROP TABLE IF EXISTS "tutorials_blocks_video_block" CASCADE;
  DROP TABLE IF EXISTS "simulators_blocks_video_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_video_block" CASCADE;
  `)
}
