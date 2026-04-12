import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  const statements = [
    // Types
    `DO $$ BEGIN CREATE TYPE "public"."enum_audio_type" AS ENUM('buttonClick', 'mouseClick', 'pageChange', 'scroll', 'background', 'custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE "public"."enum_members_social_accounts_platform" AS ENUM('twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE "public"."enum_resources_blocks_code_block_language" AS ENUM('javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'html', 'css', 'sql', 'bash', 'yaml', 'json', 'markdown', 'xml'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE "public"."enum_resources_blocks_graph_block_graph_type" AS ENUM('mermaid', 'chartData', 'html'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE "public"."enum_resources_blocks_image_block_size" AS ENUM('small', 'medium', 'large'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE "public"."enum_resources_blocks_row_block_columns" AS ENUM('1', '2', '3'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    `DO $$ BEGIN CREATE TYPE "public"."enum_resources_difficulty" AS ENUM('beginner', 'intermediate', 'advanced'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

    // Tables
    `CREATE TABLE IF NOT EXISTS "users_sessions" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "created_at" timestamp(3) with time zone, "expires_at" timestamp(3) with time zone NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "email" varchar NOT NULL, "reset_password_token" varchar, "reset_password_expiration" timestamp(3) with time zone, "salt" varchar, "hash" varchar, "login_attempts" numeric DEFAULT 0, "lock_until" timestamp(3) with time zone);`,
    `CREATE TABLE IF NOT EXISTS "media" ("id" serial PRIMARY KEY NOT NULL, "alt" varchar NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "url" varchar, "thumbnail_u_r_l" varchar, "filename" varchar, "mime_type" varchar, "filesize" numeric, "width" numeric, "height" numeric, "focal_x" numeric, "focal_y" numeric, "sizes_thumbnail_url" varchar, "sizes_thumbnail_width" numeric, "sizes_thumbnail_height" numeric, "sizes_thumbnail_mime_type" varchar, "sizes_thumbnail_filesize" numeric, "sizes_thumbnail_filename" varchar, "sizes_card_url" varchar, "sizes_card_width" numeric, "sizes_card_height" numeric, "sizes_card_mime_type" varchar, "sizes_card_filesize" numeric, "sizes_card_filename" varchar, "sizes_tablet_url" varchar, "sizes_tablet_width" numeric, "sizes_tablet_height" numeric, "sizes_tablet_mime_type" varchar, "sizes_tablet_filesize" numeric, "sizes_tablet_filename" varchar);`,
    `CREATE TABLE IF NOT EXISTS "audio_files_tags" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "tag" varchar NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "audio_files" ("id" serial PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "url" varchar, "thumbnail_u_r_l" varchar, "filename" varchar, "mime_type" varchar, "filesize" numeric, "width" numeric, "height" numeric, "focal_x" numeric, "focal_y" numeric);`,
    `CREATE TABLE IF NOT EXISTS "audio_sources" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "label" varchar, "file_id" integer, "external_url" varchar, "weight" numeric DEFAULT 1);`,
    `CREATE TABLE IF NOT EXISTS "audio" ("id" serial PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "type" "enum_audio_type" NOT NULL, "enabled" boolean DEFAULT true, "volume" numeric DEFAULT 0.3 NOT NULL, "loop" boolean DEFAULT false, "playback_rate" numeric DEFAULT 1, "fade_in_ms" numeric DEFAULT 0, "fade_out_ms" numeric DEFAULT 0, "volume_boost" numeric DEFAULT 1, "effects_echo_enabled" boolean DEFAULT false, "effects_echo_delay_ms" numeric DEFAULT 180, "effects_echo_feedback" numeric DEFAULT 0.35, "effects_echo_mix" numeric DEFAULT 0.25, "effects_ambience_enabled" boolean DEFAULT false, "effects_ambience_mix" numeric DEFAULT 0.2, "effects_ambience_lowpass_hz" numeric DEFAULT 8000, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "achievements" ("id" serial PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "summary" jsonb NOT NULL, "date" timestamp(3) with time zone NOT NULL, "image_id" integer, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "events" ("id" serial PRIMARY KEY NOT NULL, "category" varchar NOT NULL, "title" varchar NOT NULL, "slug" varchar NOT NULL, "image_id" integer NOT NULL, "short_description" varchar, "description" jsonb NOT NULL, "venue_room_name" varchar, "venue_floor" varchar, "contact_email" varchar, "contact_phone" varchar, "location_address" varchar, "location_coords_lat" numeric, "location_coords_lng" numeric, "location_zoom" numeric DEFAULT 17, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "member_categories" ("id" serial PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "slug" varchar NOT NULL, "description" varchar, "sort_order" numeric NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "member_photo" ("id" serial PRIMARY KEY NOT NULL, "alt" varchar NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "url" varchar, "thumbnail_u_r_l" varchar, "filename" varchar, "mime_type" varchar, "filesize" numeric, "width" numeric, "height" numeric, "focal_x" numeric, "focal_y" numeric, "sizes_thumbnail_url" varchar, "sizes_thumbnail_width" numeric, "sizes_thumbnail_height" numeric, "sizes_thumbnail_mime_type" varchar, "sizes_thumbnail_filesize" numeric, "sizes_thumbnail_filename" varchar, "sizes_card_url" varchar, "sizes_card_width" numeric, "sizes_card_height" numeric, "sizes_card_mime_type" varchar, "sizes_card_filesize" numeric, "sizes_card_filename" varchar, "sizes_profile_url" varchar, "sizes_profile_width" numeric, "sizes_profile_height" numeric, "sizes_profile_mime_type" varchar, "sizes_profile_filesize" numeric, "sizes_profile_filename" varchar);`,
    `CREATE TABLE IF NOT EXISTS "member_roles" ("id" serial PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "slug" varchar NOT NULL, "description" varchar, "sort_order" numeric NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "members_social_accounts" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "platform" "enum_members_social_accounts_platform", "url" varchar);`,
    `CREATE TABLE IF NOT EXISTS "members" ("id" serial PRIMARY KEY NOT NULL, "full_name" varchar NOT NULL, "photo_id" integer NOT NULL, "category_id" integer NOT NULL, "roles_id" integer NOT NULL, "bio" varchar, "start_year" numeric NOT NULL, "end_year" numeric, "github" varchar, "linkedin" varchar, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "gallery" ("id" serial PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "url" varchar, "thumbnail_u_r_l" varchar, "filename" varchar, "mime_type" varchar, "filesize" numeric, "width" numeric, "height" numeric, "focal_x" numeric, "focal_y" numeric, "sizes_thumbnail_url" varchar, "sizes_thumbnail_width" numeric, "sizes_thumbnail_height" numeric, "sizes_thumbnail_mime_type" varchar, "sizes_thumbnail_filesize" numeric, "sizes_thumbnail_filename" varchar, "sizes_card_url" varchar, "sizes_card_width" numeric, "sizes_card_height" numeric, "sizes_card_mime_type" varchar, "sizes_card_filesize" numeric, "sizes_card_filename" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_text_block" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "text" jsonb NOT NULL, "block_name" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_code_block" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "language" "enum_resources_blocks_code_block_language" NOT NULL, "code" varchar NOT NULL, "caption" varchar, "block_name" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_table_block_headers" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "header" varchar NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_table_block_rows_cells" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "cell" varchar NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_table_block_rows" ("_order" integer NOT NULL, "_parent_id" varchar NOT NULL, "id" varchar PRIMARY KEY NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_table_block" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "block_name" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_graph_block" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "graph_type" "enum_resources_blocks_graph_block_graph_type" NOT NULL, "mermaid_definition" varchar, "chart_data" jsonb, "html" varchar, "caption" varchar, "block_name" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_image_block" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "image_id" integer NOT NULL, "caption" varchar, "size" "enum_resources_blocks_image_block_size" DEFAULT 'large', "block_name" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources_blocks_row_block" ("_order" integer NOT NULL, "_parent_id" integer NOT NULL, "_path" text NOT NULL, "id" varchar PRIMARY KEY NOT NULL, "columns" "enum_resources_blocks_row_block_columns" DEFAULT '2' NOT NULL, "block_name" varchar);`,
    `CREATE TABLE IF NOT EXISTS "resources" ("id" serial PRIMARY KEY NOT NULL, "title" varchar NOT NULL, "slug" varchar NOT NULL, "description" varchar NOT NULL, "thumbnail_id" integer NOT NULL, "difficulty" "enum_resources_difficulty" DEFAULT 'beginner' NOT NULL, "estimated_read_time" numeric, "featured" boolean DEFAULT false, "last_updated" timestamp(3) with time zone, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "resources_rels" ("id" serial PRIMARY KEY NOT NULL, "order" integer, "parent_id" integer NOT NULL, "path" varchar NOT NULL, "tags_id" integer);`,
    `CREATE TABLE IF NOT EXISTS "tags" ("id" serial PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "slug" varchar NOT NULL, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "payload_mcp_api_keys" ("id" serial PRIMARY KEY NOT NULL, "user_id" integer NOT NULL, "label" varchar, "description" varchar, "users_find" boolean DEFAULT false, "users_create" boolean DEFAULT false, "users_update" boolean DEFAULT false, "media_find" boolean DEFAULT false, "media_create" boolean DEFAULT false, "media_update" boolean DEFAULT false, "achievements_find" boolean DEFAULT false, "achievements_create" boolean DEFAULT false, "achievements_update" boolean DEFAULT false, "events_find" boolean DEFAULT false, "events_create" boolean DEFAULT false, "events_update" boolean DEFAULT false, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "enable_a_p_i_key" boolean, "api_key" varchar, "api_key_index" varchar);`,
    `CREATE TABLE IF NOT EXISTS "payload_kv" ("id" serial PRIMARY KEY NOT NULL, "key" varchar NOT NULL, "data" jsonb NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "payload_locked_documents" ("id" serial PRIMARY KEY NOT NULL, "global_slug" varchar, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" ("id" serial PRIMARY KEY NOT NULL, "order" integer, "parent_id" integer NOT NULL, "path" varchar NOT NULL, "users_id" integer, "media_id" integer, "audio_files_id" integer, "audio_id" integer, "achievements_id" integer, "events_id" integer, "member_categories_id" integer, "member_photo_id" integer, "member_roles_id" integer, "members_id" integer, "gallery_id" integer, "resources_id" integer, "tags_id" integer, "payload_mcp_api_keys_id" integer);`,
    `CREATE TABLE IF NOT EXISTS "payload_preferences" ("id" serial PRIMARY KEY NOT NULL, "key" varchar, "value" jsonb, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS "payload_preferences_rels" ("id" serial PRIMARY KEY NOT NULL, "order" integer, "parent_id" integer NOT NULL, "path" varchar NOT NULL, "users_id" integer, "payload_mcp_api_keys_id" integer);`,
    `CREATE TABLE IF NOT EXISTS "payload_migrations" ("id" serial PRIMARY KEY NOT NULL, "name" varchar, "batch" numeric, "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL, "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL);`,

    // Constraints (wrapped in catch blocks in the loop)
    `ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "audio_files_tags" ADD CONSTRAINT "audio_files_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_file_id_audio_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."audio_files"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."audio"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "achievements" ADD CONSTRAINT "achievements_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "members_social_accounts" ADD CONSTRAINT "members_social_accounts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "members" ADD CONSTRAINT "members_photo_id_member_photo_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."member_photo"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "members" ADD CONSTRAINT "members_category_id_member_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."member_categories"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "members" ADD CONSTRAINT "members_roles_id_member_roles_id_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."member_roles"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_text_block" ADD CONSTRAINT "resources_blocks_text_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_code_block" ADD CONSTRAINT "resources_blocks_code_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_table_block_headers" ADD CONSTRAINT "resources_blocks_table_block_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_table_block_rows_cells" ADD CONSTRAINT "resources_blocks_table_block_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_table_block_rows"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_table_block_rows" ADD CONSTRAINT "resources_blocks_table_block_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources_blocks_table_block"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_table_block" ADD CONSTRAINT "resources_blocks_table_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_graph_block" ADD CONSTRAINT "resources_blocks_graph_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_image_block" ADD CONSTRAINT "resources_blocks_image_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_image_block" ADD CONSTRAINT "resources_blocks_image_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_blocks_row_block" ADD CONSTRAINT "resources_blocks_row_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources" ADD CONSTRAINT "resources_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "resources_rels" ADD CONSTRAINT "resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "resources_rels" ADD CONSTRAINT "resources_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audio_files_fk" FOREIGN KEY ("audio_files_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audio_fk" FOREIGN KEY ("audio_id") REFERENCES "public"."audio"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_achievements_fk" FOREIGN KEY ("achievements_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_member_categories_fk" FOREIGN KEY ("member_categories_id") REFERENCES "public"."member_categories"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_member_photo_fk" FOREIGN KEY ("member_photo_id") REFERENCES "public"."member_photo"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_member_roles_fk" FOREIGN KEY ("member_roles_id") REFERENCES "public"."member_roles"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."gallery"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("resources_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`,
    `ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_payload_mcp_api_keys_fk" FOREIGN KEY ("payload_mcp_api_keys_id") REFERENCES "public"."payload_mcp_api_keys"("id") ON DELETE cascade ON UPDATE no action;`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");`,
    `CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");`,
    `CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");`,
    `CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");`,
    `CREATE INDEX IF NOT EXISTS "media_sizes_tablet_sizes_tablet_filename_idx" ON "media" USING btree ("sizes_tablet_filename");`,
    `CREATE INDEX IF NOT EXISTS "audio_files_tags_order_idx" ON "audio_files_tags" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "audio_files_tags_parent_id_idx" ON "audio_files_tags" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "audio_files_updated_at_idx" ON "audio_files" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "audio_files_created_at_idx" ON "audio_files" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "audio_files_filename_idx" ON "audio_files" USING btree ("filename");`,
    `CREATE INDEX IF NOT EXISTS "audio_sources_order_idx" ON "audio_sources" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "audio_sources_parent_id_idx" ON "audio_sources" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "audio_sources_file_idx" ON "audio_sources" USING btree ("file_id");`,
    `CREATE INDEX IF NOT EXISTS "audio_updated_at_idx" ON "audio" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "audio_created_at_idx" ON "audio" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "achievements_image_idx" ON "achievements" USING btree ("image_id");`,
    `CREATE INDEX IF NOT EXISTS "achievements_updated_at_idx" ON "achievements" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "achievements_created_at_idx" ON "achievements" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "events_slug_idx" ON "events" USING btree ("slug");`,
    `CREATE INDEX IF NOT EXISTS "events_image_idx" ON "events" USING btree ("image_id");`,
    `CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "member_categories_slug_idx" ON "member_categories" USING btree ("slug");`,
    `CREATE INDEX IF NOT EXISTS "member_categories_updated_at_idx" ON "member_categories" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "member_categories_created_at_idx" ON "member_categories" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "member_photo_updated_at_idx" ON "member_photo" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "member_photo_created_at_idx" ON "member_photo" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "member_photo_filename_idx" ON "member_photo" USING btree ("filename");`,
    `CREATE INDEX IF NOT EXISTS "member_photo_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "member_photo" USING btree ("sizes_thumbnail_filename");`,
    `CREATE INDEX IF NOT EXISTS "member_photo_sizes_card_sizes_card_filename_idx" ON "member_photo" USING btree ("sizes_card_filename");`,
    `CREATE INDEX IF NOT EXISTS "member_photo_sizes_profile_sizes_profile_filename_idx" ON "member_photo" USING btree ("sizes_profile_filename");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "member_roles_slug_idx" ON "member_roles" USING btree ("slug");`,
    `CREATE INDEX IF NOT EXISTS "member_roles_updated_at_idx" ON "member_roles" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "member_roles_created_at_idx" ON "member_roles" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "members_social_accounts_order_idx" ON "members_social_accounts" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "members_social_accounts_parent_id_idx" ON "members_social_accounts" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "members_photo_idx" ON "members" USING btree ("photo_id");`,
    `CREATE INDEX IF NOT EXISTS "members_category_idx" ON "members" USING btree ("category_id");`,
    `CREATE INDEX IF NOT EXISTS "members_roles_idx" ON "members" USING btree ("roles_id");`,
    `CREATE INDEX IF NOT EXISTS "members_updated_at_idx" ON "members" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "members_created_at_idx" ON "members" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "gallery_updated_at_idx" ON "gallery" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "gallery_created_at_idx" ON "gallery" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "gallery_filename_idx" ON "gallery" USING btree ("filename");`,
    `CREATE INDEX IF NOT EXISTS "gallery_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "gallery" USING btree ("sizes_thumbnail_filename");`,
    `CREATE INDEX IF NOT EXISTS "gallery_sizes_card_sizes_card_filename_idx" ON "gallery" USING btree ("sizes_card_filename");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_text_block_order_idx" ON "resources_blocks_text_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_text_block_parent_id_idx" ON "resources_blocks_text_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_text_block_path_idx" ON "resources_blocks_text_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_code_block_order_idx" ON "resources_blocks_code_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_code_block_parent_id_idx" ON "resources_blocks_code_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_code_block_path_idx" ON "resources_blocks_code_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_headers_order_idx" ON "resources_blocks_table_block_headers" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_headers_parent_id_idx" ON "resources_blocks_table_block_headers" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_rows_cells_order_idx" ON "resources_blocks_table_block_rows_cells" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_rows_cells_parent_id_idx" ON "resources_blocks_table_block_rows_cells" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_rows_order_idx" ON "resources_blocks_table_block_rows" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_rows_parent_id_idx" ON "resources_blocks_table_block_rows" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_order_idx" ON "resources_blocks_table_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_parent_id_idx" ON "resources_blocks_table_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_table_block_path_idx" ON "resources_blocks_table_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_graph_block_order_idx" ON "resources_blocks_graph_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_graph_block_parent_id_idx" ON "resources_blocks_graph_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_graph_block_path_idx" ON "resources_blocks_graph_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_image_block_order_idx" ON "resources_blocks_image_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_image_block_parent_id_idx" ON "resources_blocks_image_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_image_block_path_idx" ON "resources_blocks_image_block" USING btree ("_path");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_image_block_image_idx" ON "resources_blocks_image_block" USING btree ("image_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_row_block_order_idx" ON "resources_blocks_row_block" USING btree ("_order");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_row_block_parent_id_idx" ON "resources_blocks_row_block" USING btree ("_parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_blocks_row_block_path_idx" ON "resources_blocks_row_block" USING btree ("_path");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "resources_slug_idx" ON "resources" USING btree ("slug");`,
    `CREATE INDEX IF NOT EXISTS "resources_thumbnail_idx" ON "resources" USING btree ("thumbnail_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_updated_at_idx" ON "resources" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "resources_created_at_idx" ON "resources" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "resources_rels_order_idx" ON "resources_rels" USING btree ("order");`,
    `CREATE INDEX IF NOT EXISTS "resources_rels_parent_idx" ON "resources_rels" USING btree ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "resources_rels_path_idx" ON "resources_rels" USING btree ("path");`,
    `CREATE INDEX IF NOT EXISTS "resources_rels_tags_id_idx" ON "resources_rels" USING btree ("tags_id");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "tags_name_idx" ON "tags" USING btree ("name");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" USING btree ("slug");`,
    `CREATE INDEX IF NOT EXISTS "tags_updated_at_idx" ON "tags" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "tags_created_at_idx" ON "tags" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_user_idx" ON "payload_mcp_api_keys" USING btree ("user_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_updated_at_idx" ON "payload_mcp_api_keys" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_mcp_api_keys_created_at_idx" ON "payload_mcp_api_keys" USING btree ("created_at");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audio_files_id_idx" ON "payload_locked_documents_rels" USING btree ("audio_files_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_audio_id_idx" ON "payload_locked_documents_rels" USING btree ("audio_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_achievements_id_idx" ON "payload_locked_documents_rels" USING btree ("achievements_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_member_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("member_categories_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_member_photo_id_idx" ON "payload_locked_documents_rels" USING btree ("member_photo_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_member_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("member_roles_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gallery_id_idx" ON "payload_locked_documents_rels" USING btree ("gallery_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("resources_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_payload_mcp_api_keys_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_mcp_api_keys_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_preferences_rels_payload_mcp_api_keys_id_idx" ON "payload_preferences_rels" USING btree ("payload_mcp_api_keys_id");`,
    `CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");`,
    `CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`,
  ];

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(`SAVEPOINT migration_step;`));
      await db.execute(sql.raw(statement));
      await db.execute(sql.raw(`RELEASE SAVEPOINT migration_step;`));
    } catch (e: any) {
      try {
        await db.execute(sql.raw(`ROLLBACK TO SAVEPOINT migration_step;`));
      } catch (rollbackErr) {
        // If savepoint fails, we might not be in a transaction
      }
      
      const msg = (e.message || '').toLowerCase();
      const cause = (e.cause?.message || String(e.cause) || '').toLowerCase();
      const stringified = String(e).toLowerCase();
      
      if (
        msg.includes('already exists') || msg.includes('duplicate') ||
        cause.includes('already exists') || cause.includes('duplicate') ||
        stringified.includes('already exists') || stringified.includes('duplicate')
      ) {
        // console.log(`Step skipped`);
      } else {
        console.error('Migration step failed:', e);
        throw e;
      }
    }
  }
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const tables = [
    "users_sessions", "users", "media", "audio_files_tags", "audio_files", "audio_sources", "audio",
    "achievements", "events", "member_categories", "member_photo", "member_roles", "members_social_accounts",
    "members", "gallery", "resources_blocks_text_block", "resources_blocks_code_block",
    "resources_blocks_table_block_headers", "resources_blocks_table_block_rows_cells",
    "resources_blocks_table_block_rows", "resources_blocks_table_block", "resources_blocks_graph_block",
    "resources_blocks_image_block", "resources_blocks_row_block", "resources", "resources_rels", "tags",
    "payload_mcp_api_keys", "payload_kv", "payload_locked_documents", "payload_locked_documents_rels",
    "payload_preferences", "payload_preferences_rels", "payload_migrations"
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
    } catch (e) {}
  }

  const types = [
    "enum_audio_type", "enum_members_social_accounts_platform", "enum_resources_blocks_code_block_language",
    "enum_resources_blocks_graph_block_graph_type", "enum_resources_blocks_image_block_size",
    "enum_resources_blocks_row_block_columns", "enum_resources_difficulty"
  ];

  for (const type of types) {
    try {
      await db.execute(sql.raw(`DROP TYPE IF EXISTS "public"."${type}";`));
    } catch (e) {}
  }
}
