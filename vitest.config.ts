import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { defineConfig } from "vitest/config";

// Do .env.local, só a branch de teste do Neon chega aos testes; nunca o banco de desenvolvimento.
const localEnv = existsSync(".env.local") ? parseEnv(readFileSync(".env.local", "utf8")) : {};
// A branch de teste é apagada a cada execução: nunca aceitar a mesma do DATABASE_URL.
const sameHost = (a?: string, b?: string) => Boolean(a && b && new URL(a).host === new URL(b).host);
const testDatabaseUrl = sameHost(localEnv.TEST_DATABASE_URL, localEnv.DATABASE_URL)
  ? undefined
  : localEnv.TEST_DATABASE_URL;

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    // Logs de teste não poluem a saída; o logger tem testes próprios com destino em memória.
    env: {
      LOG_LEVEL: "silent",
      ...(testDatabaseUrl ? { TEST_DATABASE_URL: testDatabaseUrl } : {}),
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          // Cada suíte de módulo sobe um PGlite e aplica as migrações; com os testes em paralelo, 5s não basta.
          testTimeout: 20_000,
          hookTimeout: 20_000,
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ui.ts"],
        },
      },
    ],
  },
});
