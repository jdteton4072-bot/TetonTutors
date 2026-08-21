import { getDb } from "@/db/client";
import { events } from "@/db/schema";

// Event kinds are a closed, documented set. Add kinds here, never ad hoc
// strings at call sites, so the efficacy queries in build-spec §5 stay honest.
export const EVENT_KINDS = [
  "user.signed_up",
  "user.signed_in",
  "user.signed_out",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export type EventPayload = Record<string, string | number | boolean | null>;

// Pure builder, unit-tested: shapes the row every logged event must have.
export function buildEvent(
  kind: EventKind,
  actorId: string | null,
  payload: EventPayload,
) {
  if (!(EVENT_KINDS as readonly string[]).includes(kind)) {
    throw new Error(`Unknown event kind: ${kind}`);
  }
  return { eventKind: kind, actorId, payload };
}

// HARD RULE (CLAUDE.md): every API mutation calls logEvent. The event log is
// append-only — there is no updateEvent and no deleteEvent, ever.
export async function logEvent(
  kind: EventKind,
  actorId: string | null,
  payload: EventPayload,
): Promise<void> {
  const row = buildEvent(kind, actorId, payload);
  const db = getDb();
  if (!db) {
    // No database configured (CI smoke run, local frontend-only work).
    // Real deployments must set DATABASE_URL; see .env.example.
    console.warn(`[events] DATABASE_URL unset; dropped event ${kind}`);
    return;
  }
  await db.insert(events).values(row);
}
