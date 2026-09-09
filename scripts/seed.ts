// Seed fixture users and items for local development.
//
// Requires DATABASE_URL (Railway Postgres). Fixture users are created
// through Better Auth so their passwords are properly hashed and the
// profiles/events hooks fire; the admin fixture is then promoted directly
// in the database (the public signup path can never mint an admin).
//
// Run: pnpm db:seed

import { eq } from "drizzle-orm";
import { user } from "../src/db/auth-schema";
import { getDb } from "../src/db/client";
import { events, items, pairings, profiles } from "../src/db/schema";
import { getAuth } from "../src/lib/auth";

const FIXTURE_PASSWORD = "teton-dev-password-1";

const FIXTURE_USERS = [
  { email: "parent@example.com", role: "parent", displayName: "Pat Parent" },
  { email: "student@example.com", role: "student", displayName: "Sam Student" },
  { email: "tutor@example.com", role: "tutor", displayName: "Toni Tutor" },
  { email: "admin@example.com", role: "admin", displayName: "Alex Admin" },
] as const;

const FIXTURE_ITEMS = [
  {
    format: "MC4" as const,
    status: "draft" as const,
    domain: "Algebra",
    skillTags: ["linear-equations-one-variable"],
    content: {
      stem: "If $3x - 7 = 14$, what is the value of $x$?",
      choices: { A: "7", B: "3", C: "21", D: "7/3" },
      key: "A",
      rationales: {
        B: "Divided 21 by 7 instead of 3 — swapped coefficient and constant.",
        C: "Added 7 to both sides but forgot to divide by 3.",
        D: "Subtracted 7 instead of adding when isolating the x term.",
      },
    },
  },
  {
    format: "SPR" as const,
    status: "draft" as const,
    domain: "Problem-Solving and Data Analysis",
    skillTags: ["mean-median"],
    content: {
      stem: "The mean of five numbers is 12. Four of them are 10, 11, 13, and 14. What is the fifth?",
      key: "12",
      rationales: {},
    },
  },
  {
    format: "MC4" as const,
    status: "draft" as const,
    domain: "Expression of Ideas",
    skillTags: ["transitions"],
    content: {
      stem: "Which choice completes the text with the most logical transition? …",
      choices: { A: "However,", B: "Therefore,", C: "Similarly,", D: "For instance," },
      key: "B",
      rationales: {
        A: "Reads the second sentence as contrast; it is a consequence.",
        C: "Treats the sentences as parallel claims rather than cause and effect.",
        D: "Treats the second sentence as an example rather than a conclusion.",
      },
    },
  },
];

async function main() {
  const db = getDb();
  const auth = getAuth();
  if (!db || !auth) {
    console.error("DATABASE_URL is not set — nothing to seed. See .env.example.");
    process.exit(1);
  }

  for (const fixture of FIXTURE_USERS) {
    // Admin signs up as a student (the role clamp allows nothing higher),
    // then is promoted below.
    const signupRole = fixture.role === "admin" ? "student" : fixture.role;
    try {
      await auth.api.signUpEmail({
        body: {
          email: fixture.email,
          password: FIXTURE_PASSWORD,
          name: fixture.displayName,
          role: signupRole,
        },
      });
      console.log(`user: ${fixture.email} (${fixture.role})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/exist/i.test(message)) {
        console.log(`user: ${fixture.email} already present, skipping`);
      } else {
        throw err;
      }
    }
  }

  // Promote the admin fixture directly — trusted server-side path only.
  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, "admin@example.com"));
  await db
    .update(profiles)
    .set({ role: "admin" })
    .where(eq(profiles.email, "admin@example.com"));
  console.log("admin@example.com promoted to admin");

  // Pair the fixture tutor with the fixture student.
  const byEmail = async (email: string) =>
    (
      await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, email))
        .limit(1)
    )[0]?.id;
  const tutorId = await byEmail("tutor@example.com");
  const studentId = await byEmail("student@example.com");
  if (tutorId && studentId) {
    await db
      .insert(pairings)
      .values({ tutorId, studentId })
      .onConflictDoNothing();
    console.log("pairing: tutor@example.com ↔ student@example.com");
  }

  for (const item of FIXTURE_ITEMS) {
    await db.insert(items).values(item);
  }
  console.log(`items: ${FIXTURE_ITEMS.length} fixtures inserted`);

  await db.insert(events).values({
    eventKind: "seed.completed",
    actorId: null,
    payload: { users: FIXTURE_USERS.length, items: FIXTURE_ITEMS.length },
  });

  console.log(`Done. Fixture password for all users: ${FIXTURE_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
