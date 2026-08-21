# Teton Tutors

Test-prep tutoring marketplace — digital SAT, ACT, and AP — with a calibrated
assessment engine, adaptive practice, and a tutor copilot.

The product and build plan live in [`docs/build-spec.md`](docs/build-spec.md).
Agent conventions live in [`CLAUDE.md`](CLAUDE.md).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase credentials
pnpm db:migrate              # apply Drizzle migrations
pnpm db:seed                 # fixture users + items
pnpm dev                     # http://localhost:3000
```

The app runs without Supabase credentials in a degraded, unauthenticated mode
(useful for UI work and CI); auth and data features need a real Supabase
project.

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test   # fast checks
pnpm build && pnpm test:e2e                # Playwright smoke tests
```

CI runs all of the above on every pull request.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Supabase (Postgres/Auth/RLS) ·
Drizzle ORM · Vitest · Playwright · Vercel
