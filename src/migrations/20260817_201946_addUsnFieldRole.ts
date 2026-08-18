import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_forms_steps_fields_role" ADD VALUE 'usn';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms_steps_fields" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "role" SET DEFAULT 'none'::text;
  DROP TYPE "public"."enum_forms_steps_fields_role";
  CREATE TYPE "public"."enum_forms_steps_fields_role" AS ENUM('none', 'name', 'email');
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "role" SET DEFAULT 'none'::"public"."enum_forms_steps_fields_role";
  ALTER TABLE "forms_steps_fields" ALTER COLUMN "role" SET DATA TYPE "public"."enum_forms_steps_fields_role" USING "role"::"public"."enum_forms_steps_fields_role";`)
}
