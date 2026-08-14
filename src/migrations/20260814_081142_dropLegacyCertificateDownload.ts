import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP CONSTRAINT "forms_certificate_template_id_media_id_fk";
  
  DROP INDEX "forms_certificate_template_idx";
  ALTER TABLE "forms" DROP COLUMN "certificate_template_id";
  ALTER TABLE "forms" DROP COLUMN "certificate_config_name_x";
  ALTER TABLE "forms" DROP COLUMN "certificate_config_name_y";
  ALTER TABLE "forms" DROP COLUMN "certificate_config_font_size";
  ALTER TABLE "forms" DROP COLUMN "certificate_config_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN "certificate_template_id" integer;
  ALTER TABLE "forms" ADD COLUMN "certificate_config_name_x" numeric DEFAULT 400;
  ALTER TABLE "forms" ADD COLUMN "certificate_config_name_y" numeric DEFAULT 300;
  ALTER TABLE "forms" ADD COLUMN "certificate_config_font_size" numeric DEFAULT 40;
  ALTER TABLE "forms" ADD COLUMN "certificate_config_color" varchar DEFAULT '#000000';
  ALTER TABLE "forms" ADD CONSTRAINT "forms_certificate_template_id_media_id_fk" FOREIGN KEY ("certificate_template_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "forms_certificate_template_idx" ON "forms" USING btree ("certificate_template_id");`)
}
