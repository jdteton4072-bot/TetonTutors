@AGENTS.md

# Teton Tutors — agent brief

Test-prep tutoring marketplace (digital SAT, ACT, AP) with a calibrated
assessment engine and a tutor copilot. **`docs/build-spec.md` is the source of
truth** — read the relevant section before building anything; §7 defines the
phased build plan and each phase's acceptance criteria.

## Stack

Next.js (App Router) + TypeScript, Tailwind v4, Supabase (Postgres, Auth,
RLS, Storage), Drizzle ORM, Vercel (hosting + cron), Vitest + Playwright.
Note: Next 16 renamed `middleware.ts` → `proxy.ts` and `cookies()` is async —
check `node_modules/next/dist/docs/` before using conventions from memory.

## Commands

- `pnpm dev` — dev server
- `pnpm lint` / `pnpm typecheck` — must pass before any commit
- `pnpm test` — Vitest unit tests
- `pnpm build && pnpm test:e2e` — Playwright smoke tests (no Supabase env needed)
- `pnpm db:generate` / `pnpm db:migrate` — Drizzle migrations (needs `DATABASE_URL`)
- `pnpm db:seed` — fixture users + items (see `scripts/seed.ts`)

Copy `.env.example` → `.env.local` for real Supabase credentials. The app must
degrade gracefully without them (unauthenticated behavior, never a crash) —
CI runs env-less.

## Hard rules

1. **The `events` table is append-only.** Every API mutation calls
   `logEvent()` (`src/lib/events.ts`). Never update or delete event rows.
   New event kinds are added to `EVENT_KINDS`, never inline strings.
2. **Parent-report numbers come only from the database.** LLMs write
   connective prose, never figures (build-spec §4.3). The approval gate has
   no bypass.
3. **No College Board or ACT content ever enters the item bank** — not
   adapted, not paraphrased (build-spec §3.1).
4. **Admins are never self-registered** (`SELF_SIGNUP_ROLES` in
   `src/lib/roles.ts`).
5. **Calibration math merges only with passing golden tests** against
   independently computed reference values (build-spec §7 Phase 6).
6. **One phase = one branch = one PR.** Never push to `main`. A phase is done
   when its acceptance criteria pass in CI.
7. Secrets stay server-side: `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL`
   never get a `NEXT_PUBLIC_` prefix and never appear in client components.
8. **Role authority is `profiles.role` via `app.user_role()` (SQL), never the
   JWT's `user_metadata`** — user_metadata is client-editable and is used for
   display only. RLS policies and helpers live in `drizzle/0001_rls.sql`;
   the client API surface is read-only except a user's own profile, and all
   writes go through the app server. Any schema change must extend the RLS
   migration and the matrix tests in `src/db/rls.test.ts` (they run against
   embedded Postgres via PGlite — the shipped migrations are what's tested).
9. **Students never read the `items` table directly** — content carries the
   key and distractor rationales; the server strips them when serving items.

## Layout

- `src/app/` — routes (App Router); server actions in `src/app/auth/actions.ts`
- `src/db/` — Drizzle schema (`schema.ts`) and lazy client (`client.ts`)
- `src/lib/` — domain logic (roles, events, supabase clients); unit tests co-located as `*.test.ts`
- `e2e/` — Playwright smoke tests
- `scripts/` — operational scripts (seed)
- `docs/` — the build spec
