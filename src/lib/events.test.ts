import { describe, expect, it } from "vitest";
import { buildEvent, EVENT_KINDS } from "./events";

describe("buildEvent", () => {
  it("shapes a row for every declared kind", () => {
    for (const kind of EVENT_KINDS) {
      const row = buildEvent(kind, null, { source: "test" });
      expect(row).toEqual({
        eventKind: kind,
        actorId: null,
        payload: { source: "test" },
      });
    }
  });

  it("carries the actor id through", () => {
    const id = "00000000-0000-0000-0000-000000000001";
    expect(buildEvent("user.signed_in", id, {}).actorId).toBe(id);
  });

  it("throws on an undeclared kind — no ad hoc event names", () => {
    // @ts-expect-error deliberately wrong kind
    expect(() => buildEvent("user.deleted_everything", null, {})).toThrow();
  });
});
