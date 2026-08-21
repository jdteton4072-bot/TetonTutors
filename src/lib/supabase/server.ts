import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Returns null when Supabase env vars are not configured (CI smoke runs,
// frontend-only local work). Callers treat null as "not authenticated".
export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component where writes are not allowed;
          // safe to ignore — the session is refreshed by server actions.
        }
      },
    },
  });
}
