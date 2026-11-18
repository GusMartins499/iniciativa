import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

const baseURL = "http://localhost:3000";

// O segredo muda a cada execução. Os workers recarregam este arquivo, mas herdam o
// valor do processo principal, que é quem assina as sessões no global-setup.
process.env.E2E_AUTH_SECRET ??= randomBytes(32).toString("base64");

// O banco é sempre o do e2e/compose.yaml, nunca o do .env.local: o global-setup apaga o
// schema dele a cada execução. O Google não é exercido, então as credenciais são falsas.
const e2eEnv = {
  DATABASE_URL: "postgres://iniciativa@postgres:5432/iniciativa_e2e",
  DATABASE_WS_PROXY: "localhost:5488/v1",
  BETTER_AUTH_URL: baseURL,
  BETTER_AUTH_SECRET: process.env.E2E_AUTH_SECRET,
  GOOGLE_CLIENT_ID: "e2e-client-id",
  GOOGLE_CLIENT_SECRET: "e2e-client-secret",
  CRON_SECRET: "e2e-cron-secret-local",
  LOG_LEVEL: "warn",
};

// O global-setup roda neste processo e lê as variáveis pelo env.ts, como o app.
Object.assign(process.env, e2eEnv);

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Os specs mudam o mesmo banco: um de cada vez.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [[process.env.CI ? "github" : "list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Testa o build de produção, não o `next dev`.
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: e2eEnv,
  },
});
