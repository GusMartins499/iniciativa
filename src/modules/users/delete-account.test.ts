import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
// Só para conferir o resultado: código de produção nunca lê a tabela de outro módulo.
import { communityMemberships } from "@/modules/communities/schema";
import { joinCommunity } from "@/modules/communities";
import { meetups } from "@/modules/meetups/schema";
import { rsvps } from "@/modules/rsvps/schema";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createTestDb } from "@/shared/db/test-db";
import { deleteAccount } from "./delete-account";
import { NOW, setupAccount, snapshot } from "./delete-account.test-setup";
import { requireOnboardedUser } from "./require-onboarded-user";

let db: Database;
let ids: Awaited<ReturnType<typeof setupAccount>>;

beforeEach(async () => {
  db = await createTestDb();
  ids = await setupAccount(db);
});

async function creatorOf(meetupId: string) {
  const [row] = await db
    .select({ creatorId: meetups.creatorId })
    .from(meetups)
    .where(eq(meetups.id, meetupId));
  return row?.creatorId;
}

describe("users.deleteAccount", () => {
  it("apaga usuário, autodeclaração, consentimento e sessões", async () => {
    const r = await deleteAccount(db, ids.userId, NOW);

    expect(r.ok).toBe(true);
    const after = await snapshot(db, ids);
    expect(after.users).toHaveLength(0);
    expect(after.onboardings).toHaveLength(0);
    expect(after.sessions).toHaveLength(0);
  });

  it("cancela os encontros futuros criados e remove o criador", async () => {
    await deleteAccount(db, ids.userId, NOW);

    expect((await snapshot(db, ids)).future?.status).toBe("cancelled");
    expect(await creatorOf(ids.futureId)).toBeNull();
  });

  it("mantém os encontros passados sem o criador", async () => {
    await deleteAccount(db, ids.userId, NOW);

    const after = await snapshot(db, ids);
    expect(after.past).not.toBeNull();
    expect(after.past?.status).toBe("active");
    expect(await creatorOf(ids.pastId)).toBeNull();
  });

  it("libera as vagas das presenças futuras, incluindo o acompanhante", async () => {
    expect((await snapshot(db, ids)).other?.occupiedSeats).toBe(5);

    await deleteAccount(db, ids.userId, NOW);

    expect((await snapshot(db, ids)).other?.occupiedSeats).toBe(3);
    expect(await db.select().from(rsvps).where(eq(rsvps.userId, ids.userId))).toHaveLength(0);
  });

  it("devolve as contagens do que foi cancelado e liberado", async () => {
    const r = await deleteAccount(db, ids.userId, NOW);

    expect(r).toEqual({
      ok: true,
      data: { cancelledMeetups: 1, releasedRsvps: 1, removedMemberships: 0 },
    });
  });

  it("remove a participação em todas as comunidades e mantém a dos outros", async () => {
    await joinCommunity(db, ids.userId, "rpg");
    await joinCommunity(db, ids.userId, "cinema");
    const other = await insertTestUser(db, "stays");
    await joinCommunity(db, other, "rpg");

    const r = await deleteAccount(db, ids.userId, NOW);

    expect(r.ok && r.data.removedMemberships).toBe(2);
    const left = await db.select().from(communityMemberships);
    expect(left.map((row) => row.userId)).toEqual([other]);
  });

  it("trata quem volta a entrar com Google como usuário novo, com onboarding pendente", async () => {
    await deleteAccount(db, ids.userId, NOW);
    const returning = await insertTestUser(db, "leaving");

    const r = await requireOnboardedUser({
      db,
      getSessionUser: async () => ({
        id: returning,
        name: "Pessoa Teste",
        email: "pessoa-teste@exemplo.test",
        image: null,
      }),
    });

    expect(r).toEqual({ ok: false, error: { code: "ONBOARDING_REQUIRED" } });
  });
});
