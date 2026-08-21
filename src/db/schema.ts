import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Phase 0 schema: the minimum needed for auth profiles, seed fixtures, and the
// event-log contract. Phase 1 replaces the item stub with the full item model
// from docs/build-spec.md §3.1 and adds responses/sessions/assignments.

export const roleEnum = pgEnum("role", ["parent", "student", "tutor", "admin"]);

export const itemStatusEnum = pgEnum("item_status", [
  "draft",
  "review",
  "pretest",
  "operational",
  "retired",
]);

export const itemFormatEnum = pgEnum("item_format", ["MC4", "SPR", "FRQ"]);

export const profiles = pgTable("profiles", {
  // Mirrors the Supabase auth.users id.
  id: uuid("id").primaryKey(),
  role: roleEnum("role").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  // For students: whether a parent has granted consent (build-spec §8).
  parentConsent: boolean("parent_consent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  format: itemFormatEnum("format").notNull(),
  status: itemStatusEnum("status").notNull().default("draft"),
  // Stem, choices, key, rationales, tags as structured JSON (build-spec §3.1).
  content: jsonb("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Append-only. Nothing updates or deletes rows here — enforced by convention
// in code now, by a DB policy in Phase 1.
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
