import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { dashboardLabel, type Role } from "@/lib/roles";

export const metadata = { title: "Dashboard · Teton Tutors" };

export default async function DashboardPage() {
  const auth = getAuth();
  if (!auth) redirect("/login");

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Role authority is the profiles table (CLAUDE.md hard rule 8).
  const db = getDb();
  const profile = db
    ? (
        await db
          .select({ role: profiles.role })
          .from(profiles)
          .where(eq(profiles.id, session.user.id))
          .limit(1)
      )[0]
    : undefined;
  const role: Role = profile?.role ?? "student";
  const name = session.user.name || session.user.email;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{dashboardLabel(role)}</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </form>
      </header>
      <p className="text-zinc-700 dark:text-zinc-300">
        Signed in as <strong>{name}</strong> ({role}).
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Phase 0 scaffold — drills, sessions, and the item bank arrive in later
        phases (see docs/build-spec.md §7).
      </p>
    </main>
  );
}
