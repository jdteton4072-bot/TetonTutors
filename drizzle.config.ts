import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Railway Postgres connection string (service → Variables → DATABASE_URL).
    url: process.env.DATABASE_URL ?? "",
  },
});
