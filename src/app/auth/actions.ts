"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { logEvent } from "@/lib/events";
import { SELF_SIGNUP_ROLES } from "@/lib/roles";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required").max(120),
  role: z.enum(SELF_SIGNUP_ROLES),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthResult = { error: string } | undefined;

const NOT_CONFIGURED = {
  error: "Auth is not configured (missing DATABASE_URL).",
};

export async function signUp(formData: FormData): Promise<AuthResult> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const auth = getAuth();
  if (!auth) return NOT_CONFIGURED;

  const { email, password, displayName, role } = parsed.data;
  try {
    // profiles mirroring + the signup event happen in the user.create
    // database hooks (src/lib/auth.ts), so every signup path is covered.
    await auth.api.signUpEmail({
      body: { email, password, name: displayName, role },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) return { error: err.message };
    throw err;
  }
  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const auth = getAuth();
  if (!auth) return NOT_CONFIGURED;

  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
    await logEvent("user.signed_in", result.user?.id ?? null, {});
  } catch (err) {
    if (err instanceof APIError) return { error: err.message };
    throw err;
  }
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const auth = getAuth();
  if (auth) {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    await auth.api.signOut({ headers: requestHeaders });
    await logEvent("user.signed_out", session?.user.id ?? null, {});
  }
  redirect("/login");
}
