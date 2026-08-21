import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazily create a single connection pool. DATABASE_URL is absent in some
// environments (CI smoke tests, local frontend-only work); callers must
// handle a null db rather than crash.
let cached: ReturnType<typeof drizzle<typeof schema>> | null | undefined;

export function getDb() {
  if (cached !== undefined) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    cached = null;
    return cached;
  }
  const sql = postgres(url, { max: 5, prepare: false });
  cached = drizzle(sql, { schema });
  return cached;
}
