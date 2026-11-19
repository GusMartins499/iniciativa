import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getMeetup } from "@/modules/meetups";
// Só para limpar a branch de teste: código de produção nunca lê a tabela de outro módulo.
import { meetups } from "@/modules/meetups/schema";
import { user } from "@/shared/auth/schema";
import { insertTestUser } from "@/shared/auth/test-helpers";
import type { Database } from "@/shared/db";
import { createNeonTestDb } from "@/shared/db/test-db";
import { routeThroughWsProxy } from "@/shared/db/ws-proxy";
import { testDatabaseUrl, testDatabaseWsProxy } from "@/shared/env";
import { confirmRsvp } from "./rsvps";
import { NOW, setupMeetup } from "./test-setup";

// O PGlite usa uma conexão só e não reproduz a corrida: este teste precisa de um Postgres de
// verdade (a branch "test" do Neon, ou no CI o Postgres do e2e atrás do wsproxy).
describe.skipIf(!testDatabaseUrl)("rsvps.confirmRsvp com concorrência (Neon)", () => {
  const prefix = `conc-${Date.now()}-`;
  let db: Database;
  let close: () => Promise<void>;

  beforeAll(async () => {
    if (testDatabaseWsProxy) routeThroughWsProxy(testDatabaseWsProxy);
    ({ db, close } = await createNeonTestDb(testDatabaseUrl ?? ""));
  });

  afterAll(async () => {
    if (!db) return;
    await db.delete(meetups).where(inArray(meetups.creatorId, [`${prefix}creator`]));
    await db.delete(user).where(inArray(user.id, [`${prefix}creator`, `${prefix}b`, `${prefix}c`]));
    await close();
  });

  it("não lota além do limite com confirmações simultâneas", async () => {
    const { meetupId } = await setupMeetup(db, 2, prefix);
    const userB = await insertTestUser(db, `${prefix}b`);
    const userC = await insertTestUser(db, `${prefix}c`);

    const results = await Promise.all([
      confirmRsvp(db, userB, meetupId, { withCompanion: false }, NOW),
      confirmRsvp(db, userC, meetupId, { withCompanion: false }, NOW),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.error.code === "MEETUP_FULL")).toHaveLength(1);
    const meetup = await getMeetup(db, meetupId);
    expect(meetup.ok && meetup.data.occupiedSeats).toBe(2);
  });
});
