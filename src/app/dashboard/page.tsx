import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { dashboardLabel, isRole } from "@/lib/roles";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard · Teton Tutors" };

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/login");

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const metaRole = user.user_metadata?.role;
  const role = isRole(metaRole) ? metaRole : "student";
  const name =
    (user.user_metadata?.display_name as string | undefined) ?? user.email;

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
