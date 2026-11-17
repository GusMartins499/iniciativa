import { fileURLToPath } from "node:url";

// Perfis de sessão gravados pelo global-setup; cada spec escolhe o seu com test.use().
// signup: conta que o Google acabou de criar, sem autodeclaração gravada ainda.
// leaver: só o teste de sair usa; sair apaga a sessão no banco.
export type Profile = "newcomer" | "member" | "signup" | "leaver";

export function storageStatePath(profile: Profile): string {
  return fileURLToPath(new URL(`../.auth/${profile}.json`, import.meta.url));
}

// Encontros seed: o do anfitrião recebe a presença do member; o do member é editado e cancelado.
export const seedMeetups = {
  hosted: { title: "Café de quinta no centro", capacity: 5 },
  ownedByMember: { title: "Caminhada na beira-rio", capacity: 4 },
} as const;

// Foto de perfil sintética (um quadrado 1x1 em data URL): o e2e não depende da internet.
export const profilePhoto =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
