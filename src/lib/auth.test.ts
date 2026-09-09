import { PGlite } from "@electric-sql/pglite";
import { APIError } from "better-auth/api";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { user } from "@/db/auth-schema";
import { events, profiles } from "@/db/schema";
import { buildAuth } from "./auth";

// End-to-end auth against embedded real Postgres with the shipped
// migrations: signup creates a properly hashed credential, mirrors the
// profile (role authority), logs the event, clamps the role, and sign-in
// verifies the password.

let pg: PGlite;
let db: ReturnType<typeof drizzle>;
let auth: ReturnType<typeof buildAuth>;

beforeAll(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  await migrate(db, { migrationsFolder: "./drizzle" });
  auth = buildAuth(db as never);
});

afterAll(async () => {
  await pg.close();
});

describe("better-auth integration", () => {
  it("signup creates the auth user, mirrors the profile, and logs the event", async () => {
    await auth.api.signUpEmail({
      body: {
        email: "tutor@test.com",
        password: "password-123",
        name: "Toni Tutor",
        role: "tutor",
      },
    });

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, "tutor@test.com"));
    expect(profile).toBeDefined();
    expect(profile.role).toBe("tutor");
    expect(profile.displayName).toBe("Toni Tutor");

    const logged = await db
      .select()
      .from(events)
      .where(eq(events.eventKind, "user.signed_up"));
    expect(logged.length).toBeGreaterThan(0);
    expect(logged.at(-1)?.actorId).toBe(profile.id);
  });

  it("clamps a requested admin role to student — no self-registered admins", async () => {
    await auth.api.signUpEmail({
      body: {
        email: "sneaky@test.com",
        password: "password-123",
        name: "Sneaky",
        role: "admin",
      },
    });

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, "sneaky@test.com"));
    expect(profile.role).toBe("student");
    const [authUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, "sneaky@test.com"));
    expect(authUser.role).toBe("student");
  });

  it("sign-in succeeds with the right password and fails with the wrong one", async () => {
    const ok = await auth.api.signInEmail({
      body: { email: "tutor@test.com", password: "password-123" },
    });
    expect(ok.user.email).toBe("tutor@test.com");

    await expect(
      auth.api.signInEmail({
        body: { email: "tutor@test.com", password: "wrong-password" },
      }),
    ).rejects.toThrow(APIError);
  });
});
