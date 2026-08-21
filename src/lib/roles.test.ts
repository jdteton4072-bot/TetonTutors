import { describe, expect, it } from "vitest";
import {
  dashboardLabel,
  isRole,
  isSelfSignupRole,
  ROLES,
  SELF_SIGNUP_ROLES,
} from "./roles";

describe("roles", () => {
  it("accepts every declared role", () => {
    for (const role of ROLES) expect(isRole(role)).toBe(true);
  });

  it("rejects unknown or non-string values", () => {
    expect(isRole("superadmin")).toBe(false);
    expect(isRole("")).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole(42)).toBe(false);
  });

  it("does not allow admin self-signup", () => {
    expect(isSelfSignupRole("admin")).toBe(false);
    for (const role of SELF_SIGNUP_ROLES) {
      expect(isSelfSignupRole(role)).toBe(true);
    }
  });

  it("labels every role's dashboard", () => {
    for (const role of ROLES) {
      expect(dashboardLabel(role)).toBeTruthy();
    }
  });
});
