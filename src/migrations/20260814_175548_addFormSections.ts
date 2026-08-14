import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms_steps_fields" ALTER COLUMN "label" DROP NOT NULL;
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "field_type" DROP NOT NULL;
  ALTER TABLE "forms_steps" ALTER COLUMN "step_title" DROP NOT NULL;
  ALTER TABLE "forms" ADD COLUMN "section_group" boolean DEFAULT false;
  ALTER TABLE "forms" ADD COLUMN "section_of_id" integer;
  ALTER TABLE "forms" ADD COLUMN "section_label" varchar;
  ALTER TABLE "forms" ADD COLUMN "section_slug" varchar;
  ALTER TABLE "forms" ADD COLUMN "section_order" numeric;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_section_of_id_forms_id_fk" FOREIGN KEY ("section_of_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "forms_section_of_idx" ON "forms" USING btree ("section_of_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP CONSTRAINT "forms_section_of_id_forms_id_fk";
  
  DROP INDEX "forms_section_of_idx";
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "label" SET NOT NULL;
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "field_type" SET NOT NULL;
  ALTER TABLE "forms_steps" ALTER COLUMN "step_title" SET NOT NULL;
  ALTER TABLE "forms" DROP COLUMN "section_group";
  ALTER TABLE "forms" DROP COLUMN "section_of_id";
  ALTER TABLE "forms" DROP COLUMN "section_label";
  ALTER TABLE "forms" DROP COLUMN "section_slug";
  ALTER TABLE "forms" DROP COLUMN "section_order";`)
}
