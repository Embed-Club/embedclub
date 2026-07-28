import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the Projects collection — member builds, with a status, the team who
 * made it, and links out to code or a demo. Block palette matches Resources
 * and Tutorials, so the DDL follows the same shape.
 *
 * `projects_rels` carries two relationships (members and tags), unlike the
 * learning collections which only relate to tags.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_projects_blocks_code_block_language" AS ENUM('javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'yaml', 'json', 'markdown', 'xml');
  CREATE TYPE "public"."enum_projects_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  CREATE TYPE "public"."enum_projects_blocks_image_block_size" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "public"."enum_projects_blocks_row_block_columns" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('planned', 'inProgress', 'completed');

  CREATE TABLE "projects_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_code_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_projects_blocks_code_block_language" NOT NULL,
  	"code" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_table_block_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header" varchar NOT NULL
  );

  CREATE TABLE "projects_blocks_table_block_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cell" varchar NOT NULL
  );

  CREATE TABLE "projects_blocks_table_block_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );

  CREATE TABLE "projects_blocks_table_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_graph_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"graph_type" "enum_projects_blocks_graph_block_graph_type" NOT NULL,
  	"mermaid_definition" varchar,
  	"chart_data" jsonb,
  	"html" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_image_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"size" "enum_projects_blocks_image_block_size" DEFAULT 'large',
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_simulator_link_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"simulator_id" integer NOT NULL,
  	"button_text" varchar DEFAULT 'Launch Simulator',
  	"block_name" varchar
  );

  CREATE TABLE "projects_blocks_row_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "enum_projects_blocks_row_block_columns" DEFAULT '2' NOT NULL,
  	"block_name" varchar
  );

  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"status" "enum_projects_status" DEFAULT 'inProgress' NOT NULL,
  	"repo_url" varchar,
  	"demo_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer,
  	"tags_id" integer
  );

  ALTER TABLE "projects_blocks_text_block" ADD CONSTRAINT "projects_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_code_block" ADD CONSTRAINT "projects_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_table_block_headers" ADD CONSTRAINT "projects_blocks_table_block_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_table_block_rows_cells" ADD CONSTRAINT "projects_blocks_table_block_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_table_block_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_table_block_rows" ADD CONSTRAINT "projects_blocks_table_block_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_table_block" ADD CONSTRAINT "projects_blocks_table_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_graph_block" ADD CONSTRAINT "projects_blocks_graph_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_image_block" ADD CONSTRAINT "projects_blocks_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_image_block" ADD CONSTRAINT "projects_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_simulator_link_block" ADD CONSTRAINT "projects_blocks_simulator_link_block_simulator_id_simulators_id_fk" FOREIGN KEY ("simulator_id") REFERENCES "public"."simulators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_blocks_simulator_link_block" ADD CONSTRAINT "projects_blocks_simulator_link_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_blocks_row_block" ADD CONSTRAINT "projects_blocks_row_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "projects_blocks_text_block_order_idx" ON "projects_blocks_text_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_text_block_parent_id_idx" ON "projects_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_text_block_path_idx" ON "projects_blocks_text_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_code_block_order_idx" ON "projects_blocks_code_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_code_block_parent_id_idx" ON "projects_blocks_code_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_code_block_path_idx" ON "projects_blocks_code_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_table_block_headers_order_idx" ON "projects_blocks_table_block_headers" USING btree ("_order");
  CREATE INDEX "projects_blocks_table_block_headers_parent_id_idx" ON "projects_blocks_table_block_headers" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_table_block_rows_cells_order_idx" ON "projects_blocks_table_block_rows_cells" USING btree ("_order");
  CREATE INDEX "projects_blocks_table_block_rows_cells_parent_id_idx" ON "projects_blocks_table_block_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_table_block_rows_order_idx" ON "projects_blocks_table_block_rows" USING btree ("_order");
  CREATE INDEX "projects_blocks_table_block_rows_parent_id_idx" ON "projects_blocks_table_block_rows" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_table_block_order_idx" ON "projects_blocks_table_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_table_block_parent_id_idx" ON "projects_blocks_table_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_table_block_path_idx" ON "projects_blocks_table_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_graph_block_order_idx" ON "projects_blocks_graph_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_graph_block_parent_id_idx" ON "projects_blocks_graph_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_graph_block_path_idx" ON "projects_blocks_graph_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_image_block_order_idx" ON "projects_blocks_image_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_image_block_parent_id_idx" ON "projects_blocks_image_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_image_block_path_idx" ON "projects_blocks_image_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_image_block_image_idx" ON "projects_blocks_image_block" USING btree ("image_id");
  CREATE INDEX "projects_blocks_simulator_link_block_order_idx" ON "projects_blocks_simulator_link_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_simulator_link_block_parent_id_idx" ON "projects_blocks_simulator_link_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_simulator_link_block_path_idx" ON "projects_blocks_simulator_link_block" USING btree ("_path");
  CREATE INDEX "projects_blocks_simulator_link_block_simulator_idx" ON "projects_blocks_simulator_link_block" USING btree ("simulator_id");
  CREATE INDEX "projects_blocks_row_block_order_idx" ON "projects_blocks_row_block" USING btree ("_order");
  CREATE INDEX "projects_blocks_row_block_parent_id_idx" ON "projects_blocks_row_block" USING btree ("_parent_id");
  CREATE INDEX "projects_blocks_row_block_path_idx" ON "projects_blocks_row_block" USING btree ("_path");
  CREATE INDEX "projects_order_idx" ON "projects" USING btree ("_order");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_thumbnail_idx" ON "projects" USING btree ("thumbnail_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_members_id_idx" ON "projects_rels" USING btree ("members_id");
  CREATE INDEX "projects_rels_tags_id_idx" ON "projects_rels" USING btree ("tags_id");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "projects_id";

  DROP TABLE IF EXISTS "projects_blocks_text_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_code_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_table_block_headers" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_table_block_rows_cells" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_table_block_rows" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_table_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_graph_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_image_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_simulator_link_block" CASCADE;
  DROP TABLE IF EXISTS "projects_blocks_row_block" CASCADE;
  DROP TABLE IF EXISTS "projects_rels" CASCADE;
  DROP TABLE IF EXISTS "projects" CASCADE;

  DROP TYPE IF EXISTS "public"."enum_projects_blocks_code_block_language";
  DROP TYPE IF EXISTS "public"."enum_projects_blocks_graph_block_graph_type";
  DROP TYPE IF EXISTS "public"."enum_projects_blocks_image_block_size";
  DROP TYPE IF EXISTS "public"."enum_projects_blocks_row_block_columns";
  DROP TYPE IF EXISTS "public"."enum_projects_status";`)
}
