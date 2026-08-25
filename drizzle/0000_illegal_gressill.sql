CREATE TYPE "public"."assignment_status" AS ENUM('assigned', 'in_progress', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."item_format" AS ENUM('MC4', 'SPR', 'FRQ');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('draft', 'review', 'pretest', 'operational', 'retired');--> statement-breakpoint
CREATE TYPE "public"."pairing_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."response_context" AS ENUM('drill', 'homework', 'full_length', 'in_session');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('parent', 'student', 'tutor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TABLE "anchor_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"test_type" text DEFAULT 'SAT' NOT NULL,
	"taken_at" date NOT NULL,
	"rw_score" integer,
	"math_score" integer,
	"total_score" integer NOT NULL,
	"source" text DEFAULT 'bluebook' NOT NULL,
	"entered_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"created_by_id" uuid,
	"session_id" uuid,
	"skill_tag" text,
	"item_ids" uuid[] DEFAULT '{}' NOT NULL,
	"status" "assignment_status" DEFAULT 'assigned' NOT NULL,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_kind" text NOT NULL,
	"actor_id" uuid,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"format" "item_format" NOT NULL,
	"status" "item_status" DEFAULT 'draft' NOT NULL,
	"content" jsonb NOT NULL,
	"domain" text NOT NULL,
	"skill_tags" text[] DEFAULT '{}' NOT NULL,
	"b_param" real,
	"b_se" real,
	"prior_b" real,
	"exposure_count" integer DEFAULT 0 NOT NULL,
	"p_value" real,
	"point_biserial" real,
	"author_id" uuid,
	"source" text DEFAULT 'ai_draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "pairing_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pairings_tutor_id_student_id_unique" UNIQUE("tutor_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" "role" NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"parent_id" uuid,
	"parent_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"session_id" uuid,
	"assignment_id" uuid,
	"context" "response_context" NOT NULL,
	"chosen_answer" text,
	"is_correct" boolean NOT NULL,
	"latency_ms" integer,
	"theta_before" real,
	"item_status_at_serve" "item_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutoring_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tutor_id" uuid NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"meeting_url" text,
	"plan" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anchor_tests" ADD CONSTRAINT "anchor_tests_entered_by_id_profiles_id_fk" FOREIGN KEY ("entered_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_id_profiles_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_session_id_tutoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tutoring_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_author_id_profiles_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_tutor_id_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pairings" ADD CONSTRAINT "pairings_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_session_id_tutoring_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."tutoring_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_assignment_id_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutoring_sessions" ADD CONSTRAINT "tutoring_sessions_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutoring_sessions" ADD CONSTRAINT "tutoring_sessions_tutor_id_profiles_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_kind_idx" ON "events" USING btree ("event_kind");--> statement-breakpoint
CREATE INDEX "items_status_idx" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "responses_student_created_idx" ON "responses" USING btree ("student_id","created_at");--> statement-breakpoint
CREATE INDEX "responses_item_idx" ON "responses" USING btree ("item_id");