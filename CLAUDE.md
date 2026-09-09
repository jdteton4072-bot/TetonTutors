@AGENTS.md

# Teton Tutors — agent brief

Test-prep tutoring marketplace (digital SAT, ACT, AP) with a calibrated
assessment engine and a tutor copilot. **`docs/build-spec.md` is the source of
truth** — read the relevant section before building anything; §7 defines the
phased build plan and each phase's acceptance criteria.

## Stack

Next.js (App Router) + TypeScript, Tailwind v4, Railway (hosting, Postgres,
cron), Better Auth (self-hosted in our Postgres, Drizzle adapter — see
`src/lib/auth.ts`), Drizzle ORM, Cloudflare (DNS/CDN/WAF in front; R2 when
object storage is needed), Vitest + Playwright.
Note: Next 16 renamed `middleware.ts` → `proxy.ts` and `cookies()` is async —
check `node_modules/next/dist/docs/` before using conventions from memory.

## Commands

- `pnpm dev` — dev server
- `pnpm lint` / `pnpm typecheck` — must pass before any commit
- `pnpm test` — Vitest unit tests
- `pnpm build && pnpm test:e2e` — Playwright smoke tests (no env needed)
- `pnpm db:generate` / `pnpm db:migrate` — Drizzle migrations (needs `DATABASE_URL`)
- `pnpm db:seed` — fixture users + items (see `scripts/seed.ts`)

Copy `.env.example` → `.env.local` for real credentials (Railway Postgres
`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`). The app must
degrade gracefully without them (unauthenticated behavior, never a crash) —
CI runs env-less and `getAuth()`/`getDb()` return null when unconfigured.

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
7. Secrets stay server-side: `DATABASE_URL` and `BETTER_AUTH_SECRET` never
   get a `NEXT_PUBLIC_` prefix and never appear in client components.
8. **Role authority is `profiles.role`, never client-supplied data.** The
   signup role clamp and profiles mirroring live in the Better Auth database
   hooks (`src/lib/auth.ts`) — the public signup API can never mint an
   admin. The database is reachable only by the app server, so every query
   in the data-access layer must be scoped by the session user's role and
   relationships. DB-level guarantees (append-only `events`, protected
   profile columns, the RLS defense-in-depth layer) live in
   `drizzle/0001_rls.sql` and are matrix-tested in `src/db/rls.test.ts`
   against embedded Postgres (PGlite) — the shipped migrations are what's
   tested; extend both on any schema change.
9. **Students never read the `items` table directly** — content carries the
   key and distractor rationales; the server strips them when serving items.

## Layout

- `src/app/` — routes (App Router); server actions in `src/app/auth/actions.ts`;
  Better Auth endpoints at `src/app/api/auth/[...all]/route.ts`
- `src/db/` — Drizzle schema (`schema.ts`), Better Auth tables
  (`auth-schema.ts`), lazy client (`client.ts`)
- `src/lib/` — domain logic (roles, events, `auth.ts`); unit tests co-located as `*.test.ts`
- `e2e/` — Playwright smoke tests
- `scripts/` — operational scripts (seed)
- `docs/` — the build spec
