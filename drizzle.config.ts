import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  // Cada módulo (e o shared/auth) declara as próprias tabelas em schema.ts.
  schema: ["./src/shared/auth/schema.ts", "./src/modules/*/schema.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
