CREATE TYPE "public"."collaboration_role" AS ENUM('viewer', 'commenter', 'editor');--> statement-breakpoint
CREATE TABLE "resume_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resume_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"role" "collaboration_role" DEFAULT 'viewer' NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_collaborators_resume_id_email_unique" UNIQUE("resume_id","email"),
	CONSTRAINT "resume_collaborators_resume_id_user_id_unique" UNIQUE("resume_id","user_id")
);