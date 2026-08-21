export const ROLES = ["parent", "student", "tutor", "admin"] as const;
export type Role = (typeof ROLES)[number];

// Roles a visitor may choose at self-signup. Admins are seeded or promoted,
// never self-registered.
export const SELF_SIGNUP_ROLES = ["parent", "student", "tutor"] as const;
export type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isSelfSignupRole(value: unknown): value is SelfSignupRole {
  return (
    typeof value === "string" &&
    (SELF_SIGNUP_ROLES as readonly string[]).includes(value)
  );
}

export function dashboardLabel(role: Role): string {
  switch (role) {
    case "parent":
      return "Parent dashboard";
    case "student":
      return "Student dashboard";
    case "tutor":
      return "Tutor dashboard";
    case "admin":
      return "Admin console";
  }
}
