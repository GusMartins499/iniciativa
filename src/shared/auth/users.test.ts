import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { user } from "./schema";
import { insertTestUser } from "./test-helpers";
import { getPublicProfiles } from "./users";

const PHOTO = "https://lh3.googleusercontent.com/a/foto-sintetica=s96-c";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

describe("auth.getPublicProfiles", () => {
  it("devolve primeiro nome e foto de várias pessoas numa consulta só", async () => {
    await insertTestUser(db, "ana", "  Ana Souza Lima");
    await insertTestUser(db, "bia", "Bia");
    await db.update(user).set({ image: PHOTO }).where(eq(user.id, "ana"));
    const select = vi.spyOn(db, "select");

    const profiles = await getPublicProfiles(db, ["ana", "bia"]);

    expect(select).toHaveBeenCalledTimes(1);
    expect(profiles.get("ana")).toEqual({ firstName: "Ana", image: PHOTO });
    expect(profiles.get("bia")).toEqual({ firstName: "Bia", image: null });
  });

  it("nunca expõe nome completo nem e-mail", async () => {
    await insertTestUser(db, "ana", "Ana Souza");

    const profile = (await getPublicProfiles(db, ["ana"])).get("ana");

    expect(Object.keys(profile ?? {}).sort()).toEqual(["firstName", "image"]);
  });

  it("sem ids, não consulta o banco", async () => {
    const select = vi.spyOn(db, "select");

    expect((await getPublicProfiles(db, [])).size).toBe(0);
    expect(select).not.toHaveBeenCalled();
  });
});
