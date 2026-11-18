import { addDays, addMinutes, subDays, subMinutes } from "date-fns";
import { randomUUID } from "node:crypto";
import { inArray, like } from "drizzle-orm";
// Os casos de uso vêm do próprio arquivo, não do index.ts do módulo: o index puxa
// next/headers (sessão), que só carrega dentro do Next.
import { createComment, deleteComment } from "@/modules/comments/comments";
import { joinCommunities } from "@/modules/communities/communities";
import type { CommunitySlug } from "@/modules/communities/list";
import { createMeetup } from "@/modules/meetups/create-meetup";
import { cancelMeetup } from "@/modules/meetups/manage-meetup";
import { meetups } from "@/modules/meetups/schema";
import { confirmRsvp } from "@/modules/rsvps/rsvps";
import { completeOnboarding } from "@/modules/users/complete-onboarding";
import { user } from "@/shared/auth/schema";
import type { Database } from "@/shared/db";
import { toAppDateInput } from "@/shared/time";

// Dados sintéticos, nunca de pessoas reais (GUIDELINES.md § Security). O domínio
// reservado marca o que é do seed: rodar de novo apaga só essas linhas.
export const SEED_EMAIL_DOMAIN = "@seed.exemplo.test";

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

// De 0 a 3 comunidades por pessoa. Fábio fica sem nenhuma, e ar-livre, academia e
// corrida ficam vazias, para ver os dois estados sem membros.
const memberships: Record<Person, CommunitySlug[]> = {
  ana: ["rpg", "card-games"],
  bruno: ["rpg", "caminhada", "cinema"],
  carla: ["caminhada"],
  davi: ["rpg"],
  elisa: ["caminhada", "musica"],
  fabio: [],
  gabi: ["clube-do-livro"],
};

type SeedComment = { person: Person; body: string; deletedBy?: "self" | "organizer" };

type SeedMeetup = {
  creator: Person;
  title: string;
  address: string;
  placeDescription?: string;
  // Padrão "open". Num encontro de comunidade, criador e confirmados precisam ser membros.
  audience?: "open" | CommunitySlug;
  // Dias a partir de hoje; negativo cria um encontro que já aconteceu.
  inDays: number;
  start: string;
  end: string;
  capacity: number;
  withCompanion: boolean;
  attendees: { person: Person; withCompanion: boolean }[];
  cancelled?: boolean;
  comments?: SeedComment[];
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
    // Conversa com um comentário apagado pelo autor e outro pelo organizador.
    comments: [
      { person: "bruno", body: "Vou chegar uns 10 minutos antes." },
      { person: "carla", body: "Tem estacionamento perto?", deletedBy: "self" },
      { person: "ana", body: "Tem sim, na rua de trás da praça." },
      { person: "davi", body: "Comentário fora do assunto.", deletedBy: "organizer" },
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
    // Só para membros de RPG, com presença confirmada de outro membro.
    creator: "davi",
    title: "Sessão de RPG para iniciantes",
    address: "Biblioteca Pública Municipal, Centro, Tubarão, SC",
    placeDescription: "Sala de reuniões do primeiro andar. Levo fichas prontas e dados.",
    audience: "rpg",
    inDays: 5,
    start: "14:00",
    end: "17:00",
    capacity: 5,
    withCompanion: false,
    attendees: [{ person: "ana", withCompanion: false }],
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
    // Só para membros de Caminhada.
    creator: "elisa",
    title: "Caminhada leve no parque",
    address: "Parque Municipal, Centro, Tubarão, SC",
    placeDescription: "Encontro no portão principal. Volta curta, sem pressa.",
    audience: "caminhada",
    inDays: 8,
    start: "07:30",
    end: "09:00",
    capacity: 6,
    withCompanion: false,
    attendees: [{ person: "carla", withCompanion: false }],
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
    // Já aconteceu: criado, confirmado e comentado "no passado" pelo `now` dos casos de
    // uso, para ver a seção de comentários só de leitura.
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
    comments: [
      { person: "ana", body: "Levo frutas e suco." },
      { person: "gabi", body: "Vou com acompanhante." },
      { person: "fabio", body: "Combinado, até lá!" },
    ],
  },
];

export type SeedCounts = { people: number; meetups: number; memberships: number; comments: number };

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
  // Presenças, comentários e meetup_comment_stats caem em cascata com o encontro;
  // participações em comunidades, com o usuário.
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
    unwrap(await joinCommunities(db, id, memberships[person]), `comunidades de ${person}`);
    ids[person] = id;
  }
  return ids;
}

async function createSeedComments(
  db: Database,
  ids: Record<Person, string>,
  meetup: SeedMeetup,
  meetupId: string,
  now: Date,
): Promise<void> {
  const comments = meetup.comments ?? [];
  // Um minuto entre comentários, terminando em `now`: nenhum fica no futuro e ninguém
  // bate no limite de 10 por minuto.
  const first = subMinutes(now, comments.length);
  for (const [index, comment] of comments.entries()) {
    const at = addMinutes(first, index);
    const what = `comentário de ${comment.person} em "${meetup.title}"`;
    const { commentId } = unwrap(
      await createComment(db, ids[comment.person], meetupId, { body: comment.body }, at),
      what,
    );
    if (comment.deletedBy) {
      const by = comment.deletedBy === "self" ? comment.person : meetup.creator;
      unwrap(await deleteComment(db, ids[by], meetupId, commentId, at), `apagar ${what}`);
    }
  }
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
        audience: meetup.audience ?? "open",
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

  await createSeedComments(db, ids, meetup, created.id, now);

  if (meetup.cancelled) {
    unwrap(
      await cancelMeetup(db, ids[meetup.creator], created.id, now),
      `cancelar "${meetup.title}"`,
    );
  }
}

export async function runSeed(db: Database): Promise<SeedCounts> {
  await removePreviousSeed(db);
  const ids = await createPeople(db);
  for (const meetup of seedMeetups) {
    await createSeedMeetup(db, ids, meetup);
  }
  return {
    people: Object.keys(people).length,
    meetups: seedMeetups.length,
    memberships: Object.values(memberships).flat().length,
    comments: seedMeetups.flatMap((meetup) => meetup.comments ?? []).length,
  };
}

export function seedSummary(counts: SeedCounts): string {
  return (
    `seed: ${counts.people} pessoas, ${counts.meetups} encontros, ` +
    `${counts.memberships} participações em comunidades e ${counts.comments} comentários ` +
    `(e-mails ${SEED_EMAIL_DOMAIN}).`
  );
}
