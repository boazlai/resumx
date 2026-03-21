CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"default_font" text,
	"auto_save" boolean DEFAULT true NOT NULL,
	"auto_save_interval" integer DEFAULT 10 NOT NULL,
	"auto_compile" boolean DEFAULT true NOT NULL,
	"linkedin_url" text,
	"github_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;