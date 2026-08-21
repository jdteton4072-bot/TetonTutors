import { expect, test } from "@playwright/test";

// Phase 0 smoke: pages render and the auth gate holds. These tests run
// without Supabase env vars — an unconfigured app must behave like an
// unauthenticated one, never crash.

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /SAT, ACT, and AP tutoring/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
});

test("login page renders its form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("signup page offers exactly the self-signup roles", async ({ page }) => {
  await page.goto("/signup");
  const options = page.locator('select[name="role"] option');
  await expect(options).toHaveText(["Parent", "Student", "Tutor"]);
});

test("dashboard redirects unauthenticated visitors to login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
