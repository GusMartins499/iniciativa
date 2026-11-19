import { describe, expect, it } from "vitest";
import { pendingMigrations } from "./pending-migrations";

const journal = {
  entries: [
    { tag: "0003_remarkable_nightshade", when: 1794865116687 },
    { tag: "0004_communities", when: 1795014526762 },
    { tag: "0005_meetup_audience", when: 1795016191572 },
  ],
};

describe("migrações pendentes", () => {
  it("considera tudo pendente num banco que nunca foi migrado", () => {
    expect(pendingMigrations(journal, null)).toEqual([
      "0003_remarkable_nightshade",
      "0004_communities",
      "0005_meetup_audience",
    ]);
  });

  it("lista só as que vêm depois da última aplicada, como o drizzle-kit migrate decide", () => {
    expect(pendingMigrations(journal, 1794865116687)).toEqual([
      "0004_communities",
      "0005_meetup_audience",
    ]);
  });

  it("não acusa nada quando a última do drizzle/ já foi aplicada", () => {
    expect(pendingMigrations(journal, 1795016191572)).toEqual([]);
  });

  it("lê o journal real do drizzle/ sem erro", async () => {
    const { readJournal } = await import("./pending-migrations");
    const real = readJournal();

    expect(real.entries.length).toBeGreaterThan(0);
    expect(real.entries[0]?.tag).toBe("0000_calm_vulcan");
  });
});
