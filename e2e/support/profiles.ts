import { fileURLToPath } from "node:url";

// Perfis de sessão gravados pelo global-setup; cada spec escolhe o seu com test.use().
export type Profile = "newcomer" | "member";

export function storageStatePath(profile: Profile): string {
  return fileURLToPath(new URL(`../.auth/${profile}.json`, import.meta.url));
}

// Encontros seed: o do anfitrião recebe a presença do member; o do member é editado e cancelado.
export const seedMeetups = {
  hosted: { title: "Café de quinta no centro", capacity: 5 },
  ownedByMember: { title: "Caminhada na beira-rio", capacity: 4 },
} as const;
