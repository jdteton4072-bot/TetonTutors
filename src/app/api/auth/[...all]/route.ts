import { getAuth } from "@/lib/auth";

// All Better Auth endpoints (sign-in, sign-up, sign-out, session, …).
// Without DATABASE_URL there is no auth backend; answer 503 instead of
// crashing so public pages and CI smoke runs keep working.

function unavailable() {
  return Response.json(
    { error: "Auth is not configured (missing DATABASE_URL)" },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const auth = getAuth();
  return auth ? auth.handler(request) : unavailable();
}

export async function POST(request: Request) {
  const auth = getAuth();
  return auth ? auth.handler(request) : unavailable();
}
