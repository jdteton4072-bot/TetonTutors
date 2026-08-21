"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { logEvent } from "@/lib/events";
import { SELF_SIGNUP_ROLES } from "@/lib/roles";
import { getSupabaseServer } from "@/lib/supabase/server";

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

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return { error: "Auth is not configured (missing Supabase env vars)." };
  }

  const { email, password, displayName, role } = parsed.data;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, role } },
  });
  if (error) return { error: error.message };

  const userId = data.user?.id ?? null;
  if (userId) {
    const db = getDb();
    if (db) {
      await db
        .insert(profiles)
        .values({ id: userId, role, email, displayName })
        .onConflictDoNothing();
    }
  }
  await logEvent("user.signed_up", userId, { role });
  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return { error: "Auth is not configured (missing Supabase env vars)." };
  }

  const { error, data } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  await logEvent("user.signed_in", data.user?.id ?? null, {});
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServer();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    await supabase.auth.signOut();
    await logEvent("user.signed_out", data.user?.id ?? null, {});
  }
  redirect("/login");
}
