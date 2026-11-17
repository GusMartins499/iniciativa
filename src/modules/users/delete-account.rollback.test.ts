import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { deleteAccount } from "./delete-account";
import { NOW, setupAccount, snapshot } from "./delete-account.test-setup";

// O passo de presenças roda de verdade e depois falha: o que ele já fez precisa ser desfeito.
vi.mock("@/modules/rsvps", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/modules/rsvps")>();
  return {
    ...original,
    removeAllByUser: async (...args: Parameters<typeof original.removeAllByUser>) => {
      await original.removeAllByUser(...args);
      throw new Error("falha simulada no passo de presenças");
    },
  };
});

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("users.deleteAccount: atomicidade", () => {
  it("desfaz tudo se um passo falhar", async () => {
    const ids = await setupAccount(db);
    const before = await snapshot(db, ids);

    await expect(deleteAccount(db, ids.userId, NOW)).rejects.toThrow("falha simulada");

    expect(await snapshot(db, ids)).toEqual(before);
  });
});
