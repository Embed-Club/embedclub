import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "about_page_current_developers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar DEFAULT 'Lead Developer',
  	"url" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "about_page_legacy_developers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar DEFAULT 'Original Developer',
  	"url" varchar,
  	"description" varchar
  );
  
  ALTER TABLE "about_page" ADD COLUMN "heritage_community_note" varchar DEFAULT 'Heartfelt gratitude to all past and present Embed Club executive members, faculty mentors, workshop leads, and student authors at P.A. College of Engineering who contributed tutorials, project documentation, and photography across both generations of the website.';
  ALTER TABLE "about_page_current_developers" ADD CONSTRAINT "about_page_current_developers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page_legacy_developers" ADD CONSTRAINT "about_page_legacy_developers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "about_page_current_developers_order_idx" ON "about_page_current_developers" USING btree ("_order");
  CREATE INDEX "about_page_current_developers_parent_id_idx" ON "about_page_current_developers" USING btree ("_parent_id");
  CREATE INDEX "about_page_legacy_developers_order_idx" ON "about_page_legacy_developers" USING btree ("_order");
  CREATE INDEX "about_page_legacy_developers_parent_id_idx" ON "about_page_legacy_developers" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "about_page_current_developers" CASCADE;
  DROP TABLE "about_page_legacy_developers" CASCADE;
  ALTER TABLE "about_page" DROP COLUMN "heritage_community_note";`)
}
