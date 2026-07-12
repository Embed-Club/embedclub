import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_simulators_blocks_code_block_language" AS ENUM('javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'yaml', 'json', 'markdown', 'xml');
  CREATE TYPE "public"."enum_simulators_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  CREATE TYPE "public"."enum_simulators_blocks_image_block_size" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "public"."enum_simulators_blocks_row_block_columns" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_simulators_category" AS ENUM('microcontrollers', 'protocols', 'rtos', 'peripherals', 'architecture');
  CREATE TYPE "public"."enum_simulators_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TABLE "feedback_forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"google_form_url" varchar NOT NULL,
  	"certificate_template_id" integer,
  	"show_certificate" boolean DEFAULT false,
  	"certificate_config_name_x" numeric DEFAULT 400,
  	"certificate_config_name_y" numeric DEFAULT 300,
  	"certificate_config_font_size" numeric DEFAULT 40,
  	"certificate_config_color" varchar DEFAULT '#000000',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "resources_blocks_simulator_link_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"simulator_id" integer NOT NULL,
  	"button_text" varchar DEFAULT 'Launch Simulator',
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_code_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_simulators_blocks_code_block_language" NOT NULL,
  	"code" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_table_block_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header" varchar NOT NULL
  );
  
  CREATE TABLE "simulators_blocks_table_block_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cell" varchar NOT NULL
  );
  
  CREATE TABLE "simulators_blocks_table_block_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "simulators_blocks_table_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_graph_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"graph_type" "enum_simulators_blocks_graph_block_graph_type" NOT NULL,
  	"mermaid_definition" varchar,
  	"chart_data" jsonb,
  	"html" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_image_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"size" "enum_simulators_blocks_image_block_size" DEFAULT 'large',
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_simulator_link_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"simulator_id" integer NOT NULL,
  	"button_text" varchar DEFAULT 'Launch Simulator',
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators_blocks_row_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "enum_simulators_blocks_row_block_columns" DEFAULT '2' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "simulators" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"category" "enum_simulators_category" NOT NULL,
  	"difficulty" "enum_simulators_difficulty" DEFAULT 'beginner',
  	"estimated_time" numeric,
  	"iframe_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "simulators_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feedback_forms_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "simulators_id" integer;
  ALTER TABLE "feedback_forms" ADD CONSTRAINT "feedback_forms_certificate_template_id_media_id_fk" FOREIGN KEY ("certificate_template_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_simulator_link_block" ADD CONSTRAINT "resources_blocks_simulator_link_block_simulator_id_simulators_id_fk" FOREIGN KEY ("simulator_id") REFERENCES "public"."simulators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_simulator_link_block" ADD CONSTRAINT "resources_blocks_simulator_link_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_text_block" ADD CONSTRAINT "simulators_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_code_block" ADD CONSTRAINT "simulators_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_table_block_headers" ADD CONSTRAINT "simulators_blocks_table_block_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_table_block_rows_cells" ADD CONSTRAINT "simulators_blocks_table_block_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators_blocks_table_block_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_table_block_rows" ADD CONSTRAINT "simulators_blocks_table_block_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_table_block" ADD CONSTRAINT "simulators_blocks_table_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_graph_block" ADD CONSTRAINT "simulators_blocks_graph_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_image_block" ADD CONSTRAINT "simulators_blocks_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulators_blocks_image_block" ADD CONSTRAINT "simulators_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_simulator_link_block" ADD CONSTRAINT "simulators_blocks_simulator_link_block_simulator_id_simulators_id_fk" FOREIGN KEY ("simulator_id") REFERENCES "public"."simulators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulators_blocks_simulator_link_block" ADD CONSTRAINT "simulators_blocks_simulator_link_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_blocks_row_block" ADD CONSTRAINT "simulators_blocks_row_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators" ADD CONSTRAINT "simulators_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "simulators_rels" ADD CONSTRAINT "simulators_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "simulators_rels" ADD CONSTRAINT "simulators_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "feedback_forms_slug_idx" ON "feedback_forms" USING btree ("slug");
  CREATE INDEX "feedback_forms_certificate_template_idx" ON "feedback_forms" USING btree ("certificate_template_id");
  CREATE INDEX "feedback_forms_updated_at_idx" ON "feedback_forms" USING btree ("updated_at");
  CREATE INDEX "feedback_forms_created_at_idx" ON "feedback_forms" USING btree ("created_at");
  CREATE INDEX "resources_blocks_simulator_link_block_order_idx" ON "resources_blocks_simulator_link_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_simulator_link_block_parent_id_idx" ON "resources_blocks_simulator_link_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_simulator_link_block_path_idx" ON "resources_blocks_simulator_link_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_simulator_link_block_simulator_idx" ON "resources_blocks_simulator_link_block" USING btree ("simulator_id");
  CREATE INDEX "simulators_blocks_text_block_order_idx" ON "simulators_blocks_text_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_text_block_parent_id_idx" ON "simulators_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_text_block_path_idx" ON "simulators_blocks_text_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_code_block_order_idx" ON "simulators_blocks_code_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_code_block_parent_id_idx" ON "simulators_blocks_code_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_code_block_path_idx" ON "simulators_blocks_code_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_table_block_headers_order_idx" ON "simulators_blocks_table_block_headers" USING btree ("_order");
  CREATE INDEX "simulators_blocks_table_block_headers_parent_id_idx" ON "simulators_blocks_table_block_headers" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_table_block_rows_cells_order_idx" ON "simulators_blocks_table_block_rows_cells" USING btree ("_order");
  CREATE INDEX "simulators_blocks_table_block_rows_cells_parent_id_idx" ON "simulators_blocks_table_block_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_table_block_rows_order_idx" ON "simulators_blocks_table_block_rows" USING btree ("_order");
  CREATE INDEX "simulators_blocks_table_block_rows_parent_id_idx" ON "simulators_blocks_table_block_rows" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_table_block_order_idx" ON "simulators_blocks_table_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_table_block_parent_id_idx" ON "simulators_blocks_table_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_table_block_path_idx" ON "simulators_blocks_table_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_graph_block_order_idx" ON "simulators_blocks_graph_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_graph_block_parent_id_idx" ON "simulators_blocks_graph_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_graph_block_path_idx" ON "simulators_blocks_graph_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_image_block_order_idx" ON "simulators_blocks_image_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_image_block_parent_id_idx" ON "simulators_blocks_image_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_image_block_path_idx" ON "simulators_blocks_image_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_image_block_image_idx" ON "simulators_blocks_image_block" USING btree ("image_id");
  CREATE INDEX "simulators_blocks_simulator_link_block_order_idx" ON "simulators_blocks_simulator_link_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_simulator_link_block_parent_id_idx" ON "simulators_blocks_simulator_link_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_simulator_link_block_path_idx" ON "simulators_blocks_simulator_link_block" USING btree ("_path");
  CREATE INDEX "simulators_blocks_simulator_link_block_simulator_idx" ON "simulators_blocks_simulator_link_block" USING btree ("simulator_id");
  CREATE INDEX "simulators_blocks_row_block_order_idx" ON "simulators_blocks_row_block" USING btree ("_order");
  CREATE INDEX "simulators_blocks_row_block_parent_id_idx" ON "simulators_blocks_row_block" USING btree ("_parent_id");
  CREATE INDEX "simulators_blocks_row_block_path_idx" ON "simulators_blocks_row_block" USING btree ("_path");
  CREATE UNIQUE INDEX "simulators_slug_idx" ON "simulators" USING btree ("slug");
  CREATE INDEX "simulators_thumbnail_idx" ON "simulators" USING btree ("thumbnail_id");
  CREATE INDEX "simulators_updated_at_idx" ON "simulators" USING btree ("updated_at");
  CREATE INDEX "simulators_created_at_idx" ON "simulators" USING btree ("created_at");
  CREATE INDEX "simulators_rels_order_idx" ON "simulators_rels" USING btree ("order");
  CREATE INDEX "simulators_rels_parent_idx" ON "simulators_rels" USING btree ("parent_id");
  CREATE INDEX "simulators_rels_path_idx" ON "simulators_rels" USING btree ("path");
  CREATE INDEX "simulators_rels_tags_id_idx" ON "simulators_rels" USING btree ("tags_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feedback_forms_fk" FOREIGN KEY ("feedback_forms_id") REFERENCES "public"."feedback_forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_simulators_fk" FOREIGN KEY ("simulators_id") REFERENCES "public"."simulators"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_feedback_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("feedback_forms_id");
  CREATE INDEX "payload_locked_documents_rels_simulators_id_idx" ON "payload_locked_documents_rels" USING btree ("simulators_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "payload_mcp_api_keys_id";
  DROP TABLE IF EXISTS "payload_mcp_api_keys" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feedback_forms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "resources_blocks_simulator_link_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_text_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_code_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_table_block_headers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_table_block_rows_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_table_block_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_table_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_graph_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_image_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_simulator_link_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_blocks_row_block" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "simulators_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "feedback_forms" CASCADE;
  DROP TABLE "resources_blocks_simulator_link_block" CASCADE;
  DROP TABLE "simulators_blocks_text_block" CASCADE;
  DROP TABLE "simulators_blocks_code_block" CASCADE;
  DROP TABLE "simulators_blocks_table_block_headers" CASCADE;
  DROP TABLE "simulators_blocks_table_block_rows_cells" CASCADE;
  DROP TABLE "simulators_blocks_table_block_rows" CASCADE;
  DROP TABLE "simulators_blocks_table_block" CASCADE;
  DROP TABLE "simulators_blocks_graph_block" CASCADE;
  DROP TABLE "simulators_blocks_image_block" CASCADE;
  DROP TABLE "simulators_blocks_simulator_link_block" CASCADE;
  DROP TABLE "simulators_blocks_row_block" CASCADE;
  DROP TABLE "simulators" CASCADE;
  DROP TABLE "simulators_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_feedback_forms_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_simulators_fk";
  
  DROP INDEX "payload_locked_documents_rels_feedback_forms_id_idx";
  DROP INDEX "payload_locked_documents_rels_simulators_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "feedback_forms_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "simulators_id";
  DROP TYPE "public"."enum_simulators_blocks_code_block_language";
  DROP TYPE "public"."enum_simulators_blocks_graph_block_graph_type";
  DROP TYPE "public"."enum_simulators_blocks_image_block_size";
  DROP TYPE "public"."enum_simulators_blocks_row_block_columns";
  DROP TYPE "public"."enum_simulators_category";
  DROP TYPE "public"."enum_simulators_difficulty";`)
}
