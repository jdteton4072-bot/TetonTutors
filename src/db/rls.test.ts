import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "./schema";

// Integration tests for the RLS migration (drizzle/0001_rls.sql) against an
// embedded real Postgres. The migrations applied here are byte-for-byte the
// ones that ship to Supabase — Phase 1's acceptance criteria:
//   - migrations apply cleanly
//   - a student cannot read another student's rows (and the rest of the
//     role matrix behaves)
//   - the event log is append-only at the database level

const ids = {
  parent: "00000000-0000-0000-0000-000000000001",
  studentA: "00000000-0000-0000-0000-00000000000a",
  studentB: "00000000-0000-0000-0000-00000000000b",
  tutor: "00000000-0000-0000-0000-000000000002",
  admin: "00000000-0000-0000-0000-000000000003",
  strangerParent: "00000000-0000-0000-0000-000000000004",
};

let pg: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

// Run a query as an authenticated API user (RLS enforced), inside a rolled-
// back transaction so tests stay independent.
async function asUser<T>(userId: string, sql: string): Promise<T[]> {
  await pg.exec("BEGIN");
  try {
    await pg.exec(`
      SET LOCAL ROLE authenticated;
      SELECT set_config('request.jwt.claims', '{"sub": "${userId}"}', true);
    `);
    const result = await pg.query<T>(sql);
    return result.rows;
  } finally {
    await pg.exec("ROLLBACK");
  }
}

async function asUserExpectError(userId: string, sql: string): Promise<string> {
  try {
    await asUser(userId, sql);
    return "";
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

beforeAll(async () => {
  pg = new PGlite();
  db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  // Seed as the owner (server context — bypasses RLS, like the app server).
  await db.insert(schema.profiles).values([
    { id: ids.parent, role: "parent", email: "p@x.com", displayName: "Parent" },
    {
      id: ids.studentA,
      role: "student",
      email: "a@x.com",
      displayName: "Student A",
      parentId: ids.parent,
      parentConsent: true,
    },
    {
      id: ids.studentB,
      role: "student",
      email: "b@x.com",
      displayName: "Student B",
    },
    { id: ids.tutor, role: "tutor", email: "t@x.com", displayName: "Tutor" },
    { id: ids.admin, role: "admin", email: "ad@x.com", displayName: "Admin" },
    {
      id: ids.strangerParent,
      role: "parent",
      email: "sp@x.com",
      displayName: "Unrelated Parent",
    },
  ]);
  await db.insert(schema.pairings).values({
    tutorId: ids.tutor,
    studentId: ids.studentA,
  });
  const [item] = await db
    .insert(schema.items)
    .values({
      format: "MC4",
      status: "pretest",
      domain: "Algebra",
      skillTags: ["linear-equations-one-variable"],
      content: { stem: "x?", choices: {}, key: "A", rationales: {} },
    })
    .returning();
  await db.insert(schema.responses).values([
    {
      studentId: ids.studentA,
      itemId: item.id,
      context: "drill",
      isCorrect: true,
      itemStatusAtServe: "pretest",
    },
    {
      studentId: ids.studentB,
      itemId: item.id,
      context: "drill",
      isCorrect: false,
      itemStatusAtServe: "pretest",
    },
  ]);
  await db.insert(schema.anchorTests).values({
    studentId: ids.studentA,
    takenAt: "2026-08-01",
    totalScore: 1050,
  });
  await db.insert(schema.events).values({
    eventKind: "seed.completed",
    actorId: null,
    payload: {},
  });
});

afterAll(async () => {
  await pg.close();
});

describe("student isolation", () => {
  it("a student cannot read another student's responses", async () => {
    const rows = await asUser<{ student_id: string }>(
      ids.studentA,
      "SELECT student_id FROM responses",
    );
    expect(rows.length).toBe(1);
    expect(rows[0].student_id).toBe(ids.studentA);
  });

  it("a student cannot read another student's profile", async () => {
    const rows = await asUser<{ id: string }>(
      ids.studentA,
      "SELECT id FROM profiles",
    );
    const seen = rows.map((r) => r.id);
    expect(seen).toContain(ids.studentA);
    expect(seen).not.toContain(ids.studentB);
  });

  it("a student cannot read the item bank (keys and rationales live there)", async () => {
    const rows = await asUser(ids.studentA, "SELECT id FROM items");
    expect(rows.length).toBe(0);
  });

  it("a student cannot read another student's anchor tests", async () => {
    const rows = await asUser(ids.studentB, "SELECT id FROM anchor_tests");
    expect(rows.length).toBe(0);
  });
});

describe("parent scope", () => {
  it("a parent sees their child's responses but not other students'", async () => {
    const rows = await asUser<{ student_id: string }>(
      ids.parent,
      "SELECT student_id FROM responses",
    );
    expect(rows.length).toBe(1);
    expect(rows[0].student_id).toBe(ids.studentA);
  });

  it("an unrelated parent sees no student data", async () => {
    const rows = await asUser(ids.strangerParent, "SELECT id FROM responses");
    expect(rows.length).toBe(0);
  });
});

describe("tutor scope", () => {
  it("a tutor sees paired students' responses only", async () => {
    const rows = await asUser<{ student_id: string }>(
      ids.tutor,
      "SELECT student_id FROM responses",
    );
    expect(rows.length).toBe(1);
    expect(rows[0].student_id).toBe(ids.studentA);
  });

  it("a tutor can read the item bank", async () => {
    const rows = await asUser(ids.tutor, "SELECT id FROM items");
    expect(rows.length).toBe(1);
  });
});

describe("admin scope", () => {
  it("an admin sees all profiles and responses", async () => {
    const profiles = await asUser(ids.admin, "SELECT id FROM profiles");
    expect(profiles.length).toBe(6);
    const responses = await asUser(ids.admin, "SELECT id FROM responses");
    expect(responses.length).toBe(2);
  });
});

describe("event log", () => {
  it("is invisible to API users", async () => {
    const message = await asUserExpectError(
      ids.admin,
      "SELECT id FROM events",
    );
    expect(message).toMatch(/permission denied/i);
  });

  it("is append-only even for the owner", async () => {
    await expect(
      pg.exec("UPDATE events SET event_kind = 'tampered'"),
    ).rejects.toThrow(/append-only/);
    await expect(pg.exec("DELETE FROM events")).rejects.toThrow(/append-only/);
  });
});

describe("privilege escalation", () => {
  it("a student cannot promote their own role", async () => {
    const message = await asUserExpectError(
      ids.studentA,
      `UPDATE profiles SET role = 'admin' WHERE id = '${ids.studentA}'`,
    );
    expect(message).toMatch(/admin-managed/);
  });

  it("a student can update their own display name", async () => {
    await asUser(
      ids.studentA,
      `UPDATE profiles SET display_name = 'New Name' WHERE id = '${ids.studentA}'`,
    );
  });
});
