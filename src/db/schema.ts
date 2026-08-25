import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// Phase 1 schema: the full data model from docs/build-spec.md (§3.1 item
// model, §5 logging). Row-level security policies live in the companion
// custom migration (drizzle/*_rls.sql) and are tested in src/db/rls.test.ts.

export const roleEnum = pgEnum("role", ["parent", "student", "tutor", "admin"]);

export const itemStatusEnum = pgEnum("item_status", [
  "draft",
  "review",
  "pretest",
  "operational",
  "retired",
]);

export const itemFormatEnum = pgEnum("item_format", ["MC4", "SPR", "FRQ"]);

export const responseContextEnum = pgEnum("response_context", [
  "drill",
  "homework",
  "full_length",
  "in_session",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "assigned",
  "in_progress",
  "completed",
  "expired",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
]);

export const pairingStatusEnum = pgEnum("pairing_status", ["active", "ended"]);

export const profiles = pgTable("profiles", {
  // Mirrors the Supabase auth.users id.
  id: uuid("id").primaryKey(),
  role: roleEnum("role").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  // For students: the parent account that owns billing and consent (§8).
  parentId: uuid("parent_id"),
  // For students: whether a parent has granted consent (§8).
  parentConsent: boolean("parent_consent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Concierge tutor–student pairing (§1 marketplace). RLS scopes tutor access
// to paired students only.
export const pairings = pgTable(
  "pairings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tutorId: uuid("tutor_id")
      .notNull()
      .references(() => profiles.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id),
    status: pairingStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.tutorId, table.studentId)],
);

// Full item model (build-spec §3.1). `content` holds stem, choices, key, and
// the per-distractor rationales — which is why students get NO direct read
// access to this table (RLS); items are served through the app server with
// key/rationales stripped.
export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    format: itemFormatEnum("format").notNull(),
    status: itemStatusEnum("status").notNull().default("draft"),
    content: jsonb("content").notNull(),
    domain: text("domain").notNull(),
    skillTags: text("skill_tags").array().notNull().default([]),
    // Rasch difficulty with standard error; null until a prior is assigned.
    bParam: real("b_param"),
    bSe: real("b_se"),
    // The cold-start prior (§3.2), kept separate so its decay is auditable.
    priorB: real("prior_b"),
    exposureCount: integer("exposure_count").notNull().default(0),
    // Rolling classical stats, written by the nightly calibration job.
    pValue: real("p_value"),
    pointBiserial: real("point_biserial"),
    authorId: uuid("author_id").references(() => profiles.id),
    source: text("source").notNull().default("ai_draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("items_status_idx").on(table.status)],
);

export const tutoringSessions = pgTable("tutoring_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id),
  tutorId: uuid("tutor_id")
    .notNull()
    .references(() => profiles.id),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  meetingUrl: text("meeting_url"),
  // The copilot's three-block plan (§4.1) and completion tracking.
  plan: jsonb("plan"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id),
  // Tutor who created it; null when the copilot generated it server-side.
  createdById: uuid("created_by_id").references(() => profiles.id),
  sessionId: uuid("session_id").references(() => tutoringSessions.id),
  skillTag: text("skill_tag"),
  itemIds: uuid("item_ids").array().notNull().default([]),
  status: assignmentStatusEnum("status").notNull().default("assigned"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per item response — the atom of the efficacy story (§5).
export const responses = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => profiles.id),
    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id),
    sessionId: uuid("session_id").references(() => tutoringSessions.id),
    assignmentId: uuid("assignment_id").references(() => assignments.id),
    context: responseContextEnum("context").notNull(),
    chosenAnswer: text("chosen_answer"),
    isCorrect: boolean("is_correct").notNull(),
    latencyMs: integer("latency_ms"),
    thetaBefore: real("theta_before"),
    itemStatusAtServe: itemStatusEnum("item_status_at_serve").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("responses_student_created_idx").on(table.studentId, table.createdAt),
    index("responses_item_idx").on(table.itemId),
  ],
);

// Official full-length practice test results (Bluebook), entered at intake
// and ~week 7. The external anchor for score prediction (§3.4) and the
// efficacy baseline (§5).
export const anchorTests = pgTable("anchor_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id),
  testType: text("test_type").notNull().default("SAT"),
  takenAt: date("taken_at").notNull(),
  rwScore: integer("rw_score"),
  mathScore: integer("math_score"),
  totalScore: integer("total_score").notNull(),
  source: text("source").notNull().default("bluebook"),
  enteredById: uuid("entered_by_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Append-only. Enforced at the database level by a trigger in the RLS
// migration — updates and deletes raise, for every role including the owner.
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventKind: text("event_kind").notNull(),
    actorId: uuid("actor_id"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("events_kind_idx").on(table.eventKind)],
);
