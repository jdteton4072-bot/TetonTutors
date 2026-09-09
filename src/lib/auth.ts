import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db/client";
import * as authSchema from "@/db/auth-schema";
import { events, profiles } from "@/db/schema";
import { buildEvent } from "@/lib/events";
import { isSelfSignupRole, type Role } from "@/lib/roles";

type AnyDrizzleDb = Parameters<typeof drizzleAdapter>[0];

// Exported for the integration test, which runs it against embedded
// Postgres (PGlite) with the shipped migrations applied.
export function buildAuth(db: AnyDrizzleDb) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be set in production");
  }

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: secret ?? "teton-dev-only-secret",
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: "string", required: false, input: true },
      },
    },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
    },
    databaseHooks: {
      user: {
        create: {
          // Role clamp: the public signup API can never mint an admin (or
          // any role outside SELF_SIGNUP_ROLES). Seeds promote admins
          // directly in the database, server-side.
          before: async (userData) => {
            const requested = (userData as { role?: unknown }).role;
            const role: Role = isSelfSignupRole(requested)
              ? requested
              : "student";
            return { data: { ...userData, role } };
          },
          // profiles is the role authority (CLAUDE.md hard rule 8); mirror
          // every new auth user into it and log the signup event here so
          // the invariant holds for every signup path, not just our form.
          after: async (newUser) => {
            const role = (newUser as { role?: string }).role;
            const safeRole: Role = isSelfSignupRole(role) ? role : "student";
            const writer = db as typeof db & {
              insert: NonNullable<ReturnType<typeof getDb>>["insert"];
            };
            await writer
              .insert(profiles)
              .values({
                id: newUser.id,
                role: safeRole,
                email: newUser.email,
                displayName: newUser.name,
              })
              .onConflictDoNothing();
            await writer
              .insert(events)
              .values(
                buildEvent("user.signed_up", newUser.id, { role: safeRole }),
              );
          },
        },
      },
    },
    // Must be last: lets server actions set auth cookies.
    plugins: [nextCookies()],
  });
}

// Lazily construct Better Auth so the app still builds and serves public
// pages without DATABASE_URL (CI smoke runs). Callers treat null as
// "auth not configured" → unauthenticated behavior, never a crash.
let cached: ReturnType<typeof buildAuth> | null | undefined;

export function getAuth() {
  if (cached !== undefined) return cached;
  const db = getDb();
  cached = db ? buildAuth(db) : null;
  return cached;
}
