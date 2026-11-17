import { addDays, subDays } from "date-fns";
import { randomUUID } from "node:crypto";
import { inArray, like } from "drizzle-orm";
// Os casos de uso vêm do próprio arquivo, não do index.ts do módulo: o index puxa
// next/headers (sessão), que só carrega dentro do Next.
import { createMeetup } from "@/modules/meetups/create-meetup";
import { cancelMeetup } from "@/modules/meetups/manage-meetup";
import { meetups } from "@/modules/meetups/schema";
import { confirmRsvp } from "@/modules/rsvps/rsvps";
import { completeOnboarding } from "@/modules/users/complete-onboarding";
import { user } from "@/shared/auth/schema";
import { getDb } from "@/shared/db/client";
import type { Database } from "@/shared/db";
import { toAppDateInput } from "@/shared/time";

// Dados sintéticos, nunca de pessoas reais (GUIDELINES.md § Security). O domínio
// reservado marca o que é do seed: rodar de novo apaga só essas linhas.
const SEED_EMAIL_DOMAIN = "@seed.exemplo.test";

const people = {
  ana: "Ana Teste",
  bruno: "Bruno Teste",
  carla: "Carla Teste",
  davi: "Davi Teste",
  elisa: "Elisa Teste",
  fabio: "Fábio Teste",
  gabi: "Gabi Teste",
} as const;

type Person = keyof typeof people;

type SeedMeetup = {
  creator: Person;
  title: string;
  address: string;
  placeDescription?: string;
  // Dias a partir de hoje; negativo cria um encontro que já aconteceu.
  inDays: number;
  start: string;
  end: string;
  capacity: number;
  withCompanion: boolean;
  attendees: { person: Person; withCompanion: boolean }[];
  cancelled?: boolean;
};

const seedMeetups: SeedMeetup[] = [
  {
    creator: "ana",
    title: "Café da tarde no centro",
    address: "Praça Walter Zumblick, Centro, Tubarão, SC",
    placeDescription: "Mesa do lado de fora, perto da fonte. Vou estar com uma camiseta azul.",
    inDays: 2,
    start: "15:00",
    end: "17:00",
    capacity: 6,
    withCompanion: false,
    attendees: [
      { person: "bruno", withCompanion: false },
      { person: "carla", withCompanion: true },
    ],
  },
  {
    creator: "bruno",
    title: "Tarde de jogos de tabuleiro na biblioteca",
    address: "Biblioteca Pública Municipal, Centro, Tubarão, SC",
    placeDescription: "Sala de estudos do térreo. Levo dois jogos curtos e fáceis de aprender.",
    inDays: 4,
    start: "14:00",
    end: "17:00",
    capacity: 8,
    withCompanion: true,
    attendees: [
      { person: "davi", withCompanion: false },
      { person: "elisa", withCompanion: false },
      { person: "fabio", withCompanion: false },
    ],
  },
  {
    // Lotado: 4 de 4 vagas, para ver o estado sem vagas.
    creator: "carla",
    title: "Caminhada na Beira-Rio",
    address: "Avenida Marcolino Martins Cabral, Beira-Rio, Tubarão, SC",
    placeDescription: "Saída em frente à ponte. Ritmo leve, cerca de 3 km.",
    inDays: 6,
    start: "08:30",
    end: "10:00",
    capacity: 4,
    withCompanion: false,
    attendees: [
      { person: "davi", withCompanion: false },
      { person: "elisa", withCompanion: true },
    ],
  },
  {
    // Sem confirmações além do criador.
    creator: "davi",
    title: "Desenho livre na praça",
    address: "Praça Sete de Setembro, Centro, Tubarão, SC",
    inDays: 9,
    start: "10:00",
    end: "12:00",
    capacity: 10,
    withCompanion: false,
    attendees: [],
  },
  {
    // Cancelado com presença confirmada, para ver o aviso de cancelado.
    creator: "elisa",
    title: "Conversa sobre filmes",
    address: "Café do Shopping Farol, Centro, Tubarão, SC",
    inDays: 12,
    start: "16:00",
    end: "18:00",
    capacity: 5,
    withCompanion: false,
    attendees: [{ person: "ana", withCompanion: false }],
    cancelled: true,
  },
  {
    // Já aconteceu: criado e confirmado "no passado" pelo `now` dos casos de uso.
    creator: "fabio",
    title: "Piquenique no parque",
    address: "Parque Municipal, Centro, Tubarão, SC",
    inDays: -5,
    start: "10:00",
    end: "13:00",
    capacity: 6,
    withCompanion: false,
    attendees: [
      { person: "ana", withCompanion: false },
      { person: "bruno", withCompanion: false },
      { person: "gabi", withCompanion: true },
    ],
  },
];

function emailOf(person: Person): string {
  return `${person}${SEED_EMAIL_DOMAIN}`;
}

function unwrap<T>(
  result: { ok: true; data: T } | { ok: false; error: { code: string } },
  what: string,
): T {
  if (!result.ok) throw new Error(`seed: ${what} falhou com ${result.error.code}`);
  return result.data;
}

async function removePreviousSeed(db: Database): Promise<void> {
  const previous = await db
    .select({ id: user.id })
    .from(user)
    .where(like(user.email, `%${SEED_EMAIL_DOMAIN}`));
  const ids = previous.map((row) => row.id);
  if (ids.length === 0) return;
  // O FK do criador é "set null": sem apagar antes, os encontros ficariam órfãos.
  // As presenças caem em cascata com o encontro e com o usuário.
  await db.delete(meetups).where(inArray(meetups.creatorId, ids));
  await db.delete(user).where(inArray(user.id, ids));
}

async function createPeople(db: Database): Promise<Record<Person, string>> {
  const ids = {} as Record<Person, string>;
  for (const [person, name] of Object.entries(people) as [Person, string][]) {
    const id = randomUUID();
    await db.insert(user).values({ id, name, email: emailOf(person), emailVerified: true });
    unwrap(
      await completeOnboarding(db, id, { declaration: true, consent: true }),
      `onboarding de ${person}`,
    );
    ids[person] = id;
  }
  return ids;
}

async function createSeedMeetup(db: Database, ids: Record<Person, string>, meetup: SeedMeetup) {
  const day = toAppDateInput(addDays(new Date(), meetup.inDays));
  // Os casos de uso recusam encontro no passado; para o que já aconteceu, o "agora"
  // deles volta para uma semana antes do início.
  const now = meetup.inDays < 0 ? subDays(new Date(), 7 - meetup.inDays) : new Date();

  const created = unwrap(
    await createMeetup(
      db,
      ids[meetup.creator],
      {
        title: meetup.title,
        startsAt: `${day}T${meetup.start}`,
        endsAt: `${day}T${meetup.end}`,
        address: meetup.address,
        placeDescription: meetup.placeDescription,
        capacity: meetup.capacity,
        publicPlace: true,
        withCompanion: meetup.withCompanion,
      },
      now,
    ),
    `encontro "${meetup.title}"`,
  );

  for (const attendee of meetup.attendees) {
    unwrap(
      await confirmRsvp(
        db,
        ids[attendee.person],
        created.id,
        { withCompanion: attendee.withCompanion },
        now,
      ),
      `presença de ${attendee.person} em "${meetup.title}"`,
    );
  }

  if (meetup.cancelled) {
    unwrap(
      await cancelMeetup(db, ids[meetup.creator], created.id, now),
      `cancelar "${meetup.title}"`,
    );
  }
}

async function main(): Promise<void> {
  const db = getDb();

  await removePreviousSeed(db);
  const ids = await createPeople(db);
  for (const meetup of seedMeetups) {
    await createSeedMeetup(db, ids, meetup);
  }

  console.log(
    `seed: ${Object.keys(people).length} pessoas e ${seedMeetups.length} encontros (e-mails ${SEED_EMAIL_DOMAIN}).`,
  );
}

await main();
// O Pool do Neon segura o processo aberto.
process.exit(0);
