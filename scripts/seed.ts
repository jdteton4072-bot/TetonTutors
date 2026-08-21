// Seed fixture users and items for local development.
//
// Requires DATABASE_URL. If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are also
// set, matching auth users are created so the fixture accounts can actually
// log in (password below); otherwise only profile rows are inserted.
//
// Run: pnpm db:seed

import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { events, items, profiles } from "../src/db/schema";

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
    content: {
      stem: "If $3x - 7 = 14$, what is the value of $x$?",
      choices: { A: "7", B: "3", C: "21", D: "7/3" },
      key: "A",
      domain: "Algebra",
      skillTags: ["linear-equations-one-variable"],
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
    content: {
      stem: "The mean of five numbers is 12. Four of them are 10, 11, 13, and 14. What is the fifth?",
      key: "12",
      domain: "Problem-Solving and Data Analysis",
      skillTags: ["mean-median"],
      rationales: {},
    },
  },
  {
    format: "MC4" as const,
    status: "draft" as const,
    content: {
      stem: "Which choice completes the text with the most logical transition? …",
      choices: { A: "However,", B: "Therefore,", C: "Similarly,", D: "For instance," },
      key: "B",
      domain: "Expression of Ideas",
      skillTags: ["transitions"],
      rationales: {
        A: "Reads the second sentence as contrast; it is a consequence.",
        C: "Treats the sentences as parallel claims rather than cause and effect.",
        D: "Treats the second sentence as an example rather than a conclusion.",
      },
    },
  },
];

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set — nothing to seed. See .env.example.");
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin =
    supabaseUrl && serviceKey
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
      : null;
  if (!admin) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY not set — seeding profiles without auth users (fixture logins will not work).",
    );
  }

  const sql = postgres(dbUrl, { max: 1, prepare: false });
  const db = drizzle(sql);

  for (const user of FIXTURE_USERS) {
    let id = crypto.randomUUID();
    if (admin) {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: FIXTURE_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: user.displayName, role: user.role },
      });
      if (error && !error.message.includes("already been registered")) {
        throw error;
      }
      if (data?.user) id = data.user.id;
    }
    await db
      .insert(profiles)
      .values({
        id,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
      })
      .onConflictDoNothing({ target: profiles.email });
    console.log(`profile: ${user.email} (${user.role})`);
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

  await sql.end();
  console.log(
    admin
      ? `Done. Fixture password for all users: ${FIXTURE_PASSWORD}`
      : "Done (profiles only).",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
