import { beforeEach, describe, expect, it, vi } from "vitest";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { logger } from "@/shared/logger";
import {
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listMemberSlugs,
  removeAllMemberships,
} from "./communities";
import { COMMUNITIES } from "./list";
import { communities, communityMemberships } from "./schema";

let db: Database;

beforeEach(async () => {
  db = await createTestDb();
});

async function memberCount(slug: string) {
  const r = await getCommunityBySlug(db, "nobody", slug);
  if (!r.ok) throw new Error("comunidade sumiu");
  return r.data.memberCount;
}

describe("communities: a lista fixa", () => {
  it("tem exatamente as 9 comunidades, com slugs estáveis", () => {
    expect(COMMUNITIES.map((community) => community.slug)).toEqual([
      "ar-livre",
      "academia",
      "rpg",
      "card-games",
      "cinema",
      "musica",
      "clube-do-livro",
      "corrida",
      "caminhada",
    ]);
    expect(COMMUNITIES.map((community) => community.name)).toEqual([
      "Ar livre",
      "Academia",
      "RPG",
      "Card games",
      "Cinema",
      "Música",
      "Clube do livro",
      "Corrida",
      "Caminhada",
    ]);
  });

  it("a lista em código e as linhas da tabela communities batem", async () => {
    const rows = await db.select().from(communities);
    const byslug = (a: { slug: string }, b: { slug: string }) => a.slug.localeCompare(b.slug);
    expect(rows.toSorted(byslug)).toEqual(
      COMMUNITIES.map(({ slug, name }) => ({ slug, name })).toSorted(byslug),
    );
  });
});

describe("communities.joinCommunity", () => {
  it("torna a pessoa membro e aumenta a contagem em 1", async () => {
    const userId = await insertTestUser(db, "user-a");

    const r = await joinCommunity(db, userId, "rpg");

    expect(r).toEqual({ ok: true, data: undefined });
    expect(await memberCount("rpg")).toBe(1);
    expect(await listMemberSlugs(db, userId)).toEqual(["rpg"]);
  });

  it("entrar duas vezes não duplica a participação", async () => {
    const userId = await insertTestUser(db, "user-a");

    await joinCommunity(db, userId, "rpg");
    const again = await joinCommunity(db, userId, "rpg");

    expect(again.ok).toBe(true);
    expect(await memberCount("rpg")).toBe(1);
    expect(await db.select().from(communityMemberships)).toHaveLength(1);
  });

  it("recusa slug inexistente", async () => {
    const userId = await insertTestUser(db, "user-a");

    expect(await joinCommunity(db, userId, "xadrez")).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });

  it("emite community.joined só com userId e communitySlug, e só na primeira vez", async () => {
    const info = vi.spyOn(logger, "info");
    const userId = await insertTestUser(db, "user-a");

    await joinCommunity(db, userId, "cinema");
    await joinCommunity(db, userId, "cinema");

    const events = info.mock.calls.filter(
      ([payload]) => (payload as { event?: string }).event === "community.joined",
    );
    expect(events).toEqual([[{ event: "community.joined", userId, communitySlug: "cinema" }]]);
    info.mockRestore();
  });
});

describe("communities.leaveCommunity", () => {
  it("tira a pessoa da comunidade e diminui a contagem em 1", async () => {
    const userA = await insertTestUser(db, "user-a");
    const userB = await insertTestUser(db, "user-b");
    await joinCommunity(db, userA, "corrida");
    await joinCommunity(db, userB, "corrida");

    const r = await leaveCommunity(db, userA, "corrida");

    expect(r.ok).toBe(true);
    expect(await memberCount("corrida")).toBe(1);
    expect(await listMemberSlugs(db, userA)).toEqual([]);
  });

  it("emite community.left só com userId e communitySlug", async () => {
    const info = vi.spyOn(logger, "info");
    const userId = await insertTestUser(db, "user-a");
    await joinCommunity(db, userId, "musica");

    await leaveCommunity(db, userId, "musica");
    await leaveCommunity(db, userId, "musica");

    const events = info.mock.calls.filter(
      ([payload]) => (payload as { event?: string }).event === "community.left",
    );
    expect(events).toEqual([[{ event: "community.left", userId, communitySlug: "musica" }]]);
    info.mockRestore();
  });
});

describe("communities: ninguém vê quem é membro", () => {
  it("a listagem traz só contagem e o próprio estado, nunca ids de membros", async () => {
    const userA = await insertTestUser(db, "user-a");
    const userB = await insertTestUser(db, "user-b");
    await joinCommunity(db, userB, "rpg");

    const list = await listCommunities(db, userA);
    const detail = await getCommunityBySlug(db, userA, "rpg");

    expect(list).toHaveLength(9);
    for (const item of list) {
      expect(Object.keys(item).toSorted()).toEqual(["isMember", "memberCount", "name", "slug"]);
    }
    expect(list.find((item) => item.slug === "rpg")).toEqual({
      slug: "rpg",
      name: "RPG",
      memberCount: 1,
      isMember: false,
    });
    expect(JSON.stringify([list, detail])).not.toContain(userB);
  });

  it("marca isMember para a própria pessoa", async () => {
    const userA = await insertTestUser(db, "user-a");
    await joinCommunity(db, userA, "caminhada");

    const list = await listCommunities(db, userA);

    expect(list.filter((item) => item.isMember).map((item) => item.slug)).toEqual(["caminhada"]);
  });
});

describe("communities.getCommunityBySlug", () => {
  it("devolve NOT_FOUND para slug inexistente", async () => {
    expect(await getCommunityBySlug(db, "user-a", "xadrez")).toEqual({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("communities.removeAllMemberships", () => {
  it("apaga todas as participações da pessoa e mantém as dos outros", async () => {
    const userA = await insertTestUser(db, "user-a");
    const userB = await insertTestUser(db, "user-b");
    await joinCommunity(db, userA, "rpg");
    await joinCommunity(db, userA, "cinema");
    await joinCommunity(db, userB, "rpg");

    const removed = await db.transaction((tx) => removeAllMemberships(tx, userA));

    expect(removed).toBe(2);
    expect(await listMemberSlugs(db, userA)).toEqual([]);
    expect(await memberCount("rpg")).toBe(1);
  });
});
