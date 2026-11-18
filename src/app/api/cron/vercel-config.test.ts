import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("vercel.json", () => {
  it("agenda o apagamento de comentários uma vez por dia", () => {
    const config: unknown = JSON.parse(
      readFileSync(new URL("../../../../vercel.json", import.meta.url), "utf8"),
    );
    expect(config).toMatchObject({
      crons: [{ path: "/api/cron/purge-comments", schedule: "0 6 * * *" }],
    });
  });
});
