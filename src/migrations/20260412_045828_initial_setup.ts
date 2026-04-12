import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_audio_type" AS ENUM('buttonClick', 'mouseClick', 'pageChange', 'scroll', 'background', 'custom');
  CREATE TYPE "public"."enum_members_social_accounts_platform" AS ENUM('twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'other');
  CREATE TYPE "public"."enum_resources_blocks_code_block_language" AS ENUM('javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'yaml', 'json', 'markdown', 'xml');
  CREATE TYPE "public"."enum_resources_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html');
  CREATE TYPE "public"."enum_resources_blocks_image_block_size" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "public"."enum_resources_blocks_row_block_columns" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_resources_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
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
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_tablet_url" varchar,
  	"sizes_tablet_width" numeric,
  	"sizes_tablet_height" numeric,
  	"sizes_tablet_mime_type" varchar,
  	"sizes_tablet_filesize" numeric,
  	"sizes_tablet_filename" varchar
  );
  
  CREATE TABLE "audio_files_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );
  
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
  
  CREATE TABLE "audio_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"file_id" integer,
  	"external_url" varchar,
  	"weight" numeric DEFAULT 1
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
  
  CREATE TABLE "achievements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" jsonb NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"short_description" varchar,
  	"description" jsonb NOT NULL,
  	"venue_room_name" varchar,
  	"venue_floor" varchar,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"location_address" varchar,
  	"location_coords_lat" numeric,
  	"location_coords_lng" numeric,
  	"location_zoom" numeric DEFAULT 17,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "member_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"sort_order" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "member_photo" (
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
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_profile_url" varchar,
  	"sizes_profile_width" numeric,
  	"sizes_profile_height" numeric,
  	"sizes_profile_mime_type" varchar,
  	"sizes_profile_filesize" numeric,
  	"sizes_profile_filename" varchar
  );
  
  CREATE TABLE "member_roles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"sort_order" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "members_social_accounts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_members_social_accounts_platform",
  	"url" varchar
  );
  
  CREATE TABLE "members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"photo_id" integer NOT NULL,
  	"category_id" integer NOT NULL,
  	"roles_id" integer NOT NULL,
  	"bio" varchar,
  	"start_year" numeric NOT NULL,
  	"end_year" numeric,
  	"github" varchar,
  	"linkedin" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gallery" (
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
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE "resources_blocks_text_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_code_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"language" "enum_resources_blocks_code_block_language" NOT NULL,
  	"code" varchar NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_table_block_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header" varchar NOT NULL
  );
  
  CREATE TABLE "resources_blocks_table_block_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cell" varchar NOT NULL
  );
  
  CREATE TABLE "resources_blocks_table_block_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "resources_blocks_table_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_graph_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"graph_type" "enum_resources_blocks_graph_block_graph_type" NOT NULL,
  	"mermaid_definition" varchar,
  	"chart_data" jsonb,
  	"html" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_image_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"size" "enum_resources_blocks_image_block_size" DEFAULT 'large',
  	"block_name" varchar
  );
  
  CREATE TABLE "resources_blocks_row_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" "enum_resources_blocks_row_block_columns" DEFAULT '2' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"thumbnail_id" integer NOT NULL,
  	"difficulty" "enum_resources_difficulty" DEFAULT 'beginner' NOT NULL,
  	"estimated_read_time" numeric,
  	"featured" boolean DEFAULT false,
  	"last_updated" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "resources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_mcp_api_keys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"label" varchar,
  	"description" varchar,
  	"users_find" boolean DEFAULT false,
  	"users_create" boolean DEFAULT false,
  	"users_update" boolean DEFAULT false,
  	"media_find" boolean DEFAULT false,
  	"media_create" boolean DEFAULT false,
  	"media_update" boolean DEFAULT false,
  	"achievements_find" boolean DEFAULT false,
  	"achievements_create" boolean DEFAULT false,
  	"achievements_update" boolean DEFAULT false,
  	"events_find" boolean DEFAULT false,
  	"events_create" boolean DEFAULT false,
  	"events_update" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"audio_files_id" integer,
  	"audio_id" integer,
  	"achievements_id" integer,
  	"events_id" integer,
  	"member_categories_id" integer,
  	"member_photo_id" integer,
  	"member_roles_id" integer,
  	"members_id" integer,
  	"gallery_id" integer,
  	"resources_id" integer,
  	"tags_id" integer,
  	"payload_mcp_api_keys_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"payload_mcp_api_keys_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audio_files_tags" ADD CONSTRAINT "audio_files_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_file_id_audio_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."audio_files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audio"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "achievements" ADD CONSTRAINT "achievements_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "members_social_accounts" ADD CONSTRAINT "members_social_accounts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members" ADD CONSTRAINT "members_photo_id_member_photo_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."member_photo"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "members" ADD CONSTRAINT "members_category_id_member_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."member_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "members" ADD CONSTRAINT "members_roles_id_member_roles_id_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."member_roles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_text_block" ADD CONSTRAINT "resources_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_code_block" ADD CONSTRAINT "resources_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_table_block_headers" ADD CONSTRAINT "resources_blocks_table_block_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_table_block_rows_cells" ADD CONSTRAINT "resources_blocks_table_block_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_table_block_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_table_block_rows" ADD CONSTRAINT "resources_blocks_table_block_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_table_block" ADD CONSTRAINT "resources_blocks_table_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_graph_block" ADD CONSTRAINT "resources_blocks_graph_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_image_block" ADD CONSTRAINT "resources_blocks_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_blocks_image_block" ADD CONSTRAINT "resources_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_blocks_row_block" ADD CONSTRAINT "resources_blocks_row_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources" ADD CONSTRAINT "resources_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "resources_rels" ADD CONSTRAINT "resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "resources_rels" ADD CONSTRAINT "resources_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audio_files_fk" FOREIGN KEY ("audio_files_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audio_fk" FOREIGN KEY ("audio_id") REFERENCES "public"."audio"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_achievements_fk" FOREIGN KEY ("achievements_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_member_categories_fk" FOREIGN KEY ("member_categories_id") REFERENCES "public"."member_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_member_photo_fk" FOREIGN KEY ("member_photo_id") REFERENCES "public"."member_photo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_member_roles_fk" FOREIGN KEY ("member_roles_id") REFERENCES "public"."member_roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_tablet_sizes_tablet_filename_idx" ON "media" USING btree ("sizes_tablet_filename");
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
  CREATE INDEX "achievements_image_idx" ON "achievements" USING btree ("image_id");
  CREATE INDEX "achievements_updated_at_idx" ON "achievements" USING btree ("updated_at");
  CREATE INDEX "achievements_created_at_idx" ON "achievements" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE UNIQUE INDEX "member_categories_slug_idx" ON "member_categories" USING btree ("slug");
  CREATE INDEX "member_categories_updated_at_idx" ON "member_categories" USING btree ("updated_at");
  CREATE INDEX "member_categories_created_at_idx" ON "member_categories" USING btree ("created_at");
  CREATE INDEX "member_photo_updated_at_idx" ON "member_photo" USING btree ("updated_at");
  CREATE INDEX "member_photo_created_at_idx" ON "member_photo" USING btree ("created_at");
  CREATE UNIQUE INDEX "member_photo_filename_idx" ON "member_photo" USING btree ("filename");
  CREATE INDEX "member_photo_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "member_photo" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "member_photo_sizes_card_sizes_card_filename_idx" ON "member_photo" USING btree ("sizes_card_filename");
  CREATE INDEX "member_photo_sizes_profile_sizes_profile_filename_idx" ON "member_photo" USING btree ("sizes_profile_filename");
  CREATE UNIQUE INDEX "member_roles_slug_idx" ON "member_roles" USING btree ("slug");
  CREATE INDEX "member_roles_updated_at_idx" ON "member_roles" USING btree ("updated_at");
  CREATE INDEX "member_roles_created_at_idx" ON "member_roles" USING btree ("created_at");
  CREATE INDEX "members_social_accounts_order_idx" ON "members_social_accounts" USING btree ("_order");
  CREATE INDEX "members_social_accounts_parent_id_idx" ON "members_social_accounts" USING btree ("_parent_id");
  CREATE INDEX "members_photo_idx" ON "members" USING btree ("photo_id");
  CREATE INDEX "members_category_idx" ON "members" USING btree ("category_id");
  CREATE INDEX "members_roles_idx" ON "members" USING btree ("roles_id");
  CREATE INDEX "members_updated_at_idx" ON "members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "members" USING btree ("created_at");
  CREATE INDEX "gallery_updated_at_idx" ON "gallery" USING btree ("updated_at");
  CREATE INDEX "gallery_created_at_idx" ON "gallery" USING btree ("created_at");
  CREATE UNIQUE INDEX "gallery_filename_idx" ON "gallery" USING btree ("filename");
  CREATE INDEX "gallery_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "gallery" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "gallery_sizes_card_sizes_card_filename_idx" ON "gallery" USING btree ("sizes_card_filename");
  CREATE INDEX "resources_blocks_text_block_order_idx" ON "resources_blocks_text_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_text_block_parent_id_idx" ON "resources_blocks_text_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_text_block_path_idx" ON "resources_blocks_text_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_code_block_order_idx" ON "resources_blocks_code_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_code_block_parent_id_idx" ON "resources_blocks_code_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_code_block_path_idx" ON "resources_blocks_code_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_table_block_headers_order_idx" ON "resources_blocks_table_block_headers" USING btree ("_order");
  CREATE INDEX "resources_blocks_table_block_headers_parent_id_idx" ON "resources_blocks_table_block_headers" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_table_block_rows_cells_order_idx" ON "resources_blocks_table_block_rows_cells" USING btree ("_order");
  CREATE INDEX "resources_blocks_table_block_rows_cells_parent_id_idx" ON "resources_blocks_table_block_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_table_block_rows_order_idx" ON "resources_blocks_table_block_rows" USING btree ("_order");
  CREATE INDEX "resources_blocks_table_block_rows_parent_id_idx" ON "resources_blocks_table_block_rows" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_table_block_order_idx" ON "resources_blocks_table_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_table_block_parent_id_idx" ON "resources_blocks_table_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_table_block_path_idx" ON "resources_blocks_table_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_graph_block_order_idx" ON "resources_blocks_graph_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_graph_block_parent_id_idx" ON "resources_blocks_graph_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_graph_block_path_idx" ON "resources_blocks_graph_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_image_block_order_idx" ON "resources_blocks_image_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_image_block_parent_id_idx" ON "resources_blocks_image_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_image_block_path_idx" ON "resources_blocks_image_block" USING btree ("_path");
  CREATE INDEX "resources_blocks_image_block_image_idx" ON "resources_blocks_image_block" USING btree ("image_id");
  CREATE INDEX "resources_blocks_row_block_order_idx" ON "resources_blocks_row_block" USING btree ("_order");
  CREATE INDEX "resources_blocks_row_block_parent_id_idx" ON "resources_blocks_row_block" USING btree ("_parent_id");
  CREATE INDEX "resources_blocks_row_block_path_idx" ON "resources_blocks_row_block" USING btree ("_path");
  CREATE UNIQUE INDEX "resources_slug_idx" ON "resources" USING btree ("slug");
  CREATE INDEX "resources_thumbnail_idx" ON "resources" USING btree ("thumbnail_id");
  CREATE INDEX "resources_updated_at_idx" ON "resources" USING btree ("updated_at");
  CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");
  CREATE INDEX "resources_rels_order_idx" ON "resources_rels" USING btree ("order");
  CREATE INDEX "resources_rels_parent_idx" ON "resources_rels" USING btree ("parent_id");
  CREATE INDEX "resources_rels_path_idx" ON "resources_rels" USING btree ("path");
  CREATE INDEX "resources_rels_tags_id_idx" ON "resources_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "tags_name_idx" ON "tags" USING btree ("name");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");
  CREATE INDEX "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");
  CREATE INDEX "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_audio_files_id_idx" ON "payload_locked_documents_rels" USING btree ("audio_files_id");
  CREATE INDEX "payload_locked_documents_rels_audio_id_idx" ON "payload_locked_documents_rels" USING btree ("audio_id");
  CREATE INDEX "payload_locked_documents_rels_achievements_id_idx" ON "payload_locked_documents_rels" USING btree ("achievements_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_member_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("member_categories_id");
  CREATE INDEX "payload_locked_documents_rels_member_photo_id_idx" ON "payload_locked_documents_rels" USING btree ("member_photo_id");
  CREATE INDEX "payload_locked_documents_rels_member_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("member_roles_id");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_locked_documents_rels_gallery_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_id");
  CREATE INDEX "payload_locked_documents_rels_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("resources_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "audio_files_tags" CASCADE;
  DROP TABLE "audio_files" CASCADE;
  DROP TABLE "audio_sources" CASCADE;
  DROP TABLE "audio" CASCADE;
  DROP TABLE "achievements" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "member_categories" CASCADE;
  DROP TABLE "member_photo" CASCADE;
  DROP TABLE "member_roles" CASCADE;
  DROP TABLE "members_social_accounts" CASCADE;
  DROP TABLE "members" CASCADE;
  DROP TABLE "gallery" CASCADE;
  DROP TABLE "resources_blocks_text_block" CASCADE;
  DROP TABLE "resources_blocks_code_block" CASCADE;
  DROP TABLE "resources_blocks_table_block_headers" CASCADE;
  DROP TABLE "resources_blocks_table_block_rows_cells" CASCADE;
  DROP TABLE "resources_blocks_table_block_rows" CASCADE;
  DROP TABLE "resources_blocks_table_block" CASCADE;
  DROP TABLE "resources_blocks_graph_block" CASCADE;
  DROP TABLE "resources_blocks_image_block" CASCADE;
  DROP TABLE "resources_blocks_row_block" CASCADE;
  DROP TABLE "resources" CASCADE;
  DROP TABLE "resources_rels" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "payload_mcp_api_keys" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_audio_type";
  DROP TYPE "public"."enum_members_social_accounts_platform";
  DROP TYPE "public"."enum_resources_blocks_code_block_language";
  DROP TYPE "public"."enum_resources_blocks_graph_block_graph_type";
  DROP TYPE "public"."enum_resources_blocks_image_block_size";
  DROP TYPE "public"."enum_resources_blocks_row_block_columns";
  DROP TYPE "public"."enum_resources_difficulty";`)
}
