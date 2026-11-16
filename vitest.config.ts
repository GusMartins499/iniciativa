import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    // Logs de teste não poluem a saída; o logger tem testes próprios com destino em memória.
    env: { LOG_LEVEL: "silent" },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
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
