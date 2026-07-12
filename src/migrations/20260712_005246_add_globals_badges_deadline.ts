import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_resources_type" AS ENUM('resource', 'tutorial');
  CREATE TYPE "public"."enum_resources_badge" AS ENUM('featured', 'popular', 'essential');
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'About Embed Club' NOT NULL,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "feedback_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Feedback' NOT NULL,
  	"intro" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "feedback_forms" ADD COLUMN "deadline" timestamp(3) with time zone;
  ALTER TABLE "resources" ADD COLUMN "type" "enum_resources_type" DEFAULT 'resource' NOT NULL;
  ALTER TABLE "resources" ADD COLUMN "badge" "enum_resources_badge";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "about_page" CASCADE;
  DROP TABLE "feedback_page" CASCADE;
  ALTER TABLE "feedback_forms" DROP COLUMN "deadline";
  ALTER TABLE "resources" DROP COLUMN "type";
  ALTER TABLE "resources" DROP COLUMN "badge";
  DROP TYPE "public"."enum_resources_type";
  DROP TYPE "public"."enum_resources_badge";`)
}
