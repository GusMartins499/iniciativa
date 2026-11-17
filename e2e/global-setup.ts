import { addDays } from "date-fns";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
// Os casos de uso vêm do próprio arquivo, não do index.ts do módulo: o index puxa
// next/headers (sessão), que só carrega dentro do Next.
import { createMeetup } from "@/modules/meetups/create-meetup";
import { completeOnboarding } from "@/modules/users/complete-onboarding";
import type { Database } from "@/shared/db";
import { createNeonTestDb } from "@/shared/db/test-db";
import { routeThroughWsProxy } from "@/shared/db/ws-proxy";
import { getServerEnv } from "@/shared/env";
import { toAppDateInput } from "@/shared/time";
import { type Profile, profilePhoto, seedMeetups, storageStatePath } from "./support/profiles";
import { createSignedInUsers } from "./support/sign-in";

// Data relativa a agora, para os encontros seed nunca ficarem no passado.
function nextWeekAt(time: string): string {
  return `${toAppDateInput(addDays(new Date(), 7))}T${time}`;
}

async function seedMeetup(
  db: Database,
  creatorId: string,
  meetup: { title: string; capacity: number },
) {
  const result = await createMeetup(db, creatorId, {
    title: meetup.title,
    startsAt: nextWeekAt("15:00"),
    endsAt: nextWeekAt("17:00"),
    address: "Praça Sete de Setembro, Centro",
    capacity: meetup.capacity,
    publicPlace: true,
    withCompanion: false,
  });
  if (!result.ok) throw new Error(`seed do encontro falhou: ${result.error.code}`);
}

async function completeOnboardingOf(db: Database, userId: string) {
  const result = await completeOnboarding(db, userId, { declaration: true, consent: true });
  if (!result.ok) throw new Error(`seed da autodeclaração falhou: ${result.error.code}`);
}

export default async function globalSetup() {
  const env = getServerEnv();
  if (!env.DATABASE_WS_PROXY) throw new Error("DATABASE_WS_PROXY ausente: rode pelo Playwright");
  routeThroughWsProxy(env.DATABASE_WS_PROXY);

  // Recria o schema e aplica as migrações: cada execução começa de um banco limpo.
  const { db, close } = await createNeonTestDb(env.DATABASE_URL);
  try {
    // Dados sintéticos, nunca de pessoas reais (GUIDELINES.md § Security).
    const users = await createSignedInUsers(db, env, {
      newcomer: { name: "Pessoa Nova", email: "pessoa-nova@exemplo.test" },
      member: { name: "Ana Teste", email: "ana-teste@exemplo.test" },
      host: { name: "Bruno Teste", email: "bruno-teste@exemplo.test" },
      signup: { name: "Carla Teste", email: "carla-teste@exemplo.test" },
      leaver: { name: "Davi Teste", email: "davi-teste@exemplo.test", image: profilePhoto },
    });
    await completeOnboardingOf(db, users.member.id);
    await completeOnboardingOf(db, users.host.id);
    await completeOnboardingOf(db, users.leaver.id);
    await seedMeetup(db, users.host.id, seedMeetups.hosted);
    await seedMeetup(db, users.member.id, seedMeetups.ownedByMember);

    const profiles: Profile[] = ["newcomer", "member", "signup", "leaver"];
    for (const profile of profiles) {
      const path = storageStatePath(profile);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(users[profile].storageState));
    }
  } finally {
    await close();
  }
}
