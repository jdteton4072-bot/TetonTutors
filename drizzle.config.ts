import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Supabase Postgres connection string (Settings → Database → URI).
    url: process.env.DATABASE_URL ?? "",
  },
});
