-- Row-level security, role helpers, and integrity triggers.
-- Written to apply on BOTH Supabase (where auth.uid() and the API roles
-- already exist — the guarded blocks no-op) and vanilla Postgres/PGlite
-- (used by src/db/rls.test.ts), so the exact SQL that is tested is the
-- exact SQL that ships.

-- ── Compatibility shims (no-ops on Supabase) ────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'CREATE ROLE authenticated NOLOGIN';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'CREATE ROLE anon NOLOGIN';
  END IF;
END $$;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS auth;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE
      AS 'SELECT NULLIF(current_setting(''request.jwt.claims'', true)::json->>''sub'', '''')::uuid'
    $fn$;
  END IF;
END $$;
--> statement-breakpoint

-- ── Role helpers ────────────────────────────────────────────────────────────
-- Authority for a user's role is the profiles table, NEVER the JWT's
-- user_metadata (which the client can edit). SECURITY DEFINER so the lookup
-- is not itself blocked by RLS on profiles.
CREATE SCHEMA IF NOT EXISTS app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role::text FROM public.profiles WHERE id = auth.uid() $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.is_admin() RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT app.user_role() = 'admin' $$;
--> statement-breakpoint
-- True when the current user is an active tutor of the given student.
CREATE OR REPLACE FUNCTION app.tutors_student(sid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pairings
    WHERE tutor_id = auth.uid() AND student_id = sid AND status = 'active'
  )
$$;
--> statement-breakpoint
-- True when the current user is the parent of the given student.
CREATE OR REPLACE FUNCTION app.parents_student(sid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = sid AND parent_id = auth.uid()
  )
$$;
--> statement-breakpoint

-- ── Enable RLS everywhere (deny by default) ─────────────────────────────────
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pairings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tutoring_sessions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "responses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "anchor_tests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- ── Grants ──────────────────────────────────────────────────────────────────
-- The client-facing API surface is read-only except a user's own profile;
-- all writes go through the app server (which connects as the table owner).
-- anon gets nothing. events gets no client grants at all.
GRANT USAGE ON SCHEMA public TO authenticated;
--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO authenticated;
--> statement-breakpoint
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;
--> statement-breakpoint
GRANT SELECT ON "profiles", "pairings", "items", "tutoring_sessions", "assignments", "responses", "anchor_tests" TO authenticated;
--> statement-breakpoint
GRANT UPDATE ON "profiles" TO authenticated;
--> statement-breakpoint

-- ── Policies ────────────────────────────────────────────────────────────────
-- profiles: self, their children (parent), paired students (tutor), admin.
CREATE POLICY profiles_select ON "profiles" FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR parent_id = auth.uid()
    OR app.tutors_student(id)
    OR app.is_admin()
  );
--> statement-breakpoint
CREATE POLICY profiles_update_own ON "profiles" FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
--> statement-breakpoint
-- pairings: visible to both sides, the student's parent, and admin.
CREATE POLICY pairings_select ON "pairings" FOR SELECT TO authenticated
  USING (
    tutor_id = auth.uid()
    OR student_id = auth.uid()
    OR app.parents_student(student_id)
    OR app.is_admin()
  );
--> statement-breakpoint
-- items: tutors and admins only. Students NEVER read this table directly —
-- content includes the key and distractor rationales; the app server strips
-- them when serving items.
CREATE POLICY items_select_staff ON "items" FOR SELECT TO authenticated
  USING (app.user_role() IN ('tutor', 'admin'));
--> statement-breakpoint
-- Student-scoped tables: own rows, their tutor, their parent, admin.
CREATE POLICY sessions_select ON "tutoring_sessions" FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR tutor_id = auth.uid()
    OR app.parents_student(student_id)
    OR app.is_admin()
  );
--> statement-breakpoint
CREATE POLICY assignments_select ON "assignments" FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR app.tutors_student(student_id)
    OR app.parents_student(student_id)
    OR app.is_admin()
  );
--> statement-breakpoint
CREATE POLICY responses_select ON "responses" FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR app.tutors_student(student_id)
    OR app.parents_student(student_id)
    OR app.is_admin()
  );
--> statement-breakpoint
CREATE POLICY anchor_tests_select ON "anchor_tests" FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR app.tutors_student(student_id)
    OR app.parents_student(student_id)
    OR app.is_admin()
  );
--> statement-breakpoint
-- events: no policies on purpose — server-only, unreadable via the client API.

-- ── Integrity triggers ──────────────────────────────────────────────────────
-- events is append-only for EVERYONE, owner included (CLAUDE.md hard rule 1).
CREATE OR REPLACE FUNCTION app.events_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'events is append-only';
END $$;
--> statement-breakpoint
CREATE TRIGGER events_no_update BEFORE UPDATE ON "events"
  FOR EACH ROW EXECUTE FUNCTION app.events_append_only();
--> statement-breakpoint
CREATE TRIGGER events_no_delete BEFORE DELETE ON "events"
  FOR EACH ROW EXECUTE FUNCTION app.events_append_only();
--> statement-breakpoint
-- Privilege escalation guard: an API user (JWT present) may not change role,
-- parent_id, or parent_consent unless admin. Server-side sessions (no JWT)
-- are unaffected — consent and role changes happen through server flows.
CREATE OR REPLACE FUNCTION app.protect_profile_columns() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(current_setting('request.jwt.claims', true), '') = '' THEN
    RETURN NEW;
  END IF;
  IF NOT app.is_admin() AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.parent_id IS DISTINCT FROM OLD.parent_id
    OR NEW.parent_consent IS DISTINCT FROM OLD.parent_consent
  ) THEN
    RAISE EXCEPTION 'profile role/consent columns are admin-managed';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER profiles_protect_columns BEFORE UPDATE ON "profiles"
  FOR EACH ROW EXECUTE FUNCTION app.protect_profile_columns();
