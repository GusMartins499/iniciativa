import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type CommunitySlug, joinCommunity, leaveCommunity } from "@/modules/communities";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { logger } from "@/shared/logger";
import { createMeetup } from "./create-meetup";
import { updateMeetup } from "./manage-meetup";
import {
  canSeeMeetup,
  countUpcomingByCommunities,
  countUpcomingByCommunity,
  getMeetup,
  listUpcoming,
  listUpcomingByCommunity,
} from "./queries";

const CREATED_AT = new Date("2026-11-01T12:00:00.000Z");
const NOW = new Date("2026-11-20T12:00:00.000Z");

const baseInput = {
  title: "Encontro",
  startsAt: "2026-12-05T15:00",
  endsAt: "2026-12-05T17:00",
  address: "Rua X, 100",
  capacity: 10,
  publicPlace: true,
  withCompanion: false,
  audience: "open",
};

let db: Database;
let creatorId: string;

beforeEach(async () => {
  db = await createTestDb();
  creatorId = await insertTestUser(db, "creator");
  await joinCommunity(db, creatorId, "rpg");
});

async function create(title: string, audience: string, day = "2026-12-05") {
  const r = await createMeetup(
    db,
    creatorId,
    { ...baseInput, title, audience, startsAt: `${day}T15:00`, endsAt: `${day}T17:00` },
    CREATED_AT,
  );
  if (!r.ok) throw new Error(`falha ao criar: ${r.error.code}`);
  return r.data.id;
}

function viewer(userId: string, memberSlugs: CommunitySlug[] = [], hasRsvp = false) {
  return { userId, memberSlugs, hasRsvp };
}

describe("meetups.createMeetup: público", () => {
  it("cria encontro aberto sem comunidade", async () => {
    const r = await createMeetup(db, creatorId, baseInput, CREATED_AT);

    expect(r).toMatchObject({ ok: true, data: { communitySlug: null } });
  });

  it("cria encontro numa comunidade da qual o criador é membro", async () => {
    const r = await createMeetup(db, creatorId, { ...baseInput, audience: "rpg" }, CREATED_AT);

    expect(r).toMatchObject({ ok: true, data: { communitySlug: "rpg" } });
  });

  it("recusa sem público escolhido", async () => {
    const input: Record<string, unknown> = { ...baseInput };
    delete input.audience;

    const r = await createMeetup(db, creatorId, input, CREATED_AT);

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa comunidade inexistente", async () => {
    const r = await createMeetup(db, creatorId, { ...baseInput, audience: "xadrez" }, CREATED_AT);

    expect(r).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("recusa comunidade da qual o criador não é membro e loga warn sem PII", async () => {
    const warn = vi.spyOn(logger, "warn");

    const r = await createMeetup(db, creatorId, { ...baseInput, audience: "cinema" }, CREATED_AT);

    expect(r).toEqual({ ok: false, error: { code: "NOT_COMMUNITY_MEMBER" } });
    expect(warn).toHaveBeenCalledWith({
      event: "meetup.create_rejected",
      userId: creatorId,
      communitySlug: "cinema",
      code: "NOT_COMMUNITY_MEMBER",
    });
  });

  it("emite meetup.created com o público", async () => {
    const info = vi.spyOn(logger, "info");

    await create("RPG", "rpg");
    await create("Aberto", "open");

    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "meetup.created", audience: "rpg" }),
    );
    expect(info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "meetup.created", audience: "open" }),
    );
  });
});

describe("meetups.updateMeetup: público", () => {
  it("aceita a edição com o mesmo público", async () => {
    const id = await create("RPG", "rpg");

    const r = await updateMeetup(
      db,
      creatorId,
      id,
      { ...baseInput, audience: "rpg", title: "RPG de mesa" },
      NOW,
    );

    expect(r.ok).toBe(true);
  });

  it.each([
    ["open", "rpg"],
    ["rpg", "open"],
    ["rpg", "cinema"],
  ])("recusa mudar o público de %s para %s", async (from, to) => {
    const id = await create("Encontro", from);

    const r = await updateMeetup(db, creatorId, id, { ...baseInput, audience: to }, NOW);

    expect(r).toEqual({ ok: false, error: { code: "AUDIENCE_LOCKED" } });
    const after = await getMeetup(db, id);
    expect(after.ok && after.data.communitySlug).toBe(from === "open" ? null : from);
  });
});

describe("meetups.listUpcoming: visibilidade", () => {
  it("mostra os abertos mais os das minhas comunidades, em ordem de data", async () => {
    await create("rpg dia 7", "rpg", "2026-12-07");
    await create("aberto dia 6", "open", "2026-12-06");
    await create("rpg dia 5", "rpg", "2026-12-05");

    const r = await listUpcoming(db, ["rpg"], NOW);

    expect(r.ok && r.data.map((m) => m.title)).toEqual(["rpg dia 5", "aberto dia 6", "rpg dia 7"]);
  });

  it("não mostra encontro de comunidade para quem não é membro", async () => {
    await create("rpg", "rpg");
    await create("aberto", "open");

    const r = await listUpcoming(db, ["cinema"], NOW);

    expect(r.ok && r.data.map((m) => m.title)).toEqual(["aberto"]);
  });
});

describe("meetups por comunidade", () => {
  it("conta os encontros futuros e ativos da comunidade", async () => {
    await create("rpg 1", "rpg");
    await create("rpg 2", "rpg", "2026-12-06");
    await create("passado", "rpg", "2026-11-10");
    await create("aberto", "open");

    expect(await countUpcomingByCommunity(db, "rpg", NOW)).toBe(2);
    expect(await countUpcomingByCommunity(db, "cinema", NOW)).toBe(0);
  });

  it("conta os encontros futuros de todas as comunidades numa consulta só, por slug", async () => {
    await joinCommunity(db, creatorId, "cinema");
    await create("rpg 1", "rpg");
    await create("rpg 2", "rpg", "2026-12-06");
    await create("passado", "rpg", "2026-11-10");
    await create("cinema", "cinema");
    await create("aberto", "open");

    const counts = await countUpcomingByCommunities(db, NOW);

    expect(counts.get("rpg")).toBe(2);
    expect(counts.get("cinema")).toBe(1);
    expect(counts.has("corrida")).toBe(false);
    expect([...counts.keys()].sort()).toEqual(["cinema", "rpg"]);
  });

  it("lista só os encontros futuros da comunidade", async () => {
    await create("rpg", "rpg");
    await create("aberto", "open");

    const meetups = await listUpcomingByCommunity(db, "rpg", NOW);

    expect(meetups.map((m) => m.title)).toEqual(["rpg"]);
  });
});

describe("meetups.canSeeMeetup", () => {
  it("encontro aberto é visível para todos", async () => {
    const id = await create("aberto", "open");

    expect(await canSeeMeetup(db, id, viewer("someone"))).toEqual({
      visible: true,
      communitySlug: null,
    });
  });

  it("encontro de comunidade é visível para membro", async () => {
    const id = await create("rpg", "rpg");

    expect((await canSeeMeetup(db, id, viewer("someone", ["rpg"]))).visible).toBe(true);
  });

  it("encontro de comunidade não é visível para não-membro", async () => {
    const id = await create("rpg", "rpg");

    expect(await canSeeMeetup(db, id, viewer("someone", ["cinema"]))).toEqual({
      visible: false,
      communitySlug: "rpg",
    });
  });

  it("continua visível para quem tem presença confirmada, mesmo fora da comunidade", async () => {
    const id = await create("rpg", "rpg");

    expect((await canSeeMeetup(db, id, viewer("someone", [], true))).visible).toBe(true);
  });

  it("continua visível para o criador que saiu da comunidade", async () => {
    const id = await create("rpg", "rpg");
    await leaveCommunity(db, creatorId, "rpg");

    expect((await canSeeMeetup(db, id, viewer(creatorId))).visible).toBe(true);
  });

  it("encontro inexistente não é visível", async () => {
    const r = await canSeeMeetup(db, "00000000-0000-0000-0000-000000000000", viewer("someone"));

    expect(r.visible).toBe(false);
  });
});

describe("migração do público", () => {
  it("os encontros que já existiam ficam abertos", async () => {
    const client = new PGlite();
    const folder = new URL("../../../drizzle/", import.meta.url);
    const journal = JSON.parse(readFileSync(new URL("meta/_journal.json", folder), "utf8")) as {
      entries: { tag: string }[];
    };
    const run = async (tag: string) => {
      const sql = readFileSync(new URL(`${tag}.sql`, folder), "utf8");
      for (const statement of sql.split("--> statement-breakpoint")) {
        if (statement.trim()) await client.exec(statement);
      }
    };
    const tags = journal.entries.map((entry) => entry.tag);
    const audienceIndex = tags.indexOf("0005_meetup_audience");
    for (const tag of tags.slice(0, audienceIndex)) await run(tag);
    await client.exec(`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
        VALUES ('old', 'Pessoa', 'old@exemplo.test', true, now(), now());
      INSERT INTO meetups (creator_id, title, address, starts_at, ends_at, capacity,
        occupied_seats, creator_with_companion)
        VALUES ('old', 'Antigo', 'Rua X', '2026-12-05T18:00Z', '2026-12-05T20:00Z', 10, 1, false);
    `);

    await run("0005_meetup_audience");

    const r = await client.query<{ community_slug: string | null }>(
      "SELECT community_slug FROM meetups",
    );
    expect(r.rows).toEqual([{ community_slug: null }]);
  });
});
