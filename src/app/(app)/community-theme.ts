import {
  BookOpen,
  Clapperboard,
  Dumbbell,
  Footprints,
  type LucideIcon,
  Music,
  Spade,
  Swords,
  Timer,
  Trees,
} from "lucide-react";
import type { CommunitySlug } from "@/modules/communities/client";

// Identidade visual (docs/product/iniciativa-mvp.md): cada comunidade tem um tom suave e
// um ícone. A cor reforça o reconhecimento; o nome escrito continua sendo a informação.
export type CommunityTheme = {
  icon: LucideIcon;
  background: string;
  foreground: string;
};

const THEMES: Record<CommunitySlug, CommunityTheme> = {
  "ar-livre": { icon: Trees, background: "#E3F1E4", foreground: "#1F5130" },
  academia: { icon: Dumbbell, background: "#FCE7E3", foreground: "#8A2E1C" },
  rpg: { icon: Swords, background: "#EDE7F6", foreground: "#4C2F7A" },
  "card-games": { icon: Spade, background: "#E1EEF7", foreground: "#1E4E79" },
  cinema: { icon: Clapperboard, background: "#F7E6EE", foreground: "#7A2350" },
  musica: { icon: Music, background: "#FDF0D9", foreground: "#7A4A06" },
  "clube-do-livro": { icon: BookOpen, background: "#EFE8DD", foreground: "#5A4128" },
  corrida: { icon: Timer, background: "#E0F2F1", foreground: "#0F5953" },
  caminhada: { icon: Footprints, background: "#EEF2E0", foreground: "#4A5A14" },
};

function isCommunitySlug(slug: string): slug is CommunitySlug {
  return Object.hasOwn(THEMES, slug);
}

// Encontro aberto (null) não tem tema.
export function communityTheme(slug: string | null): CommunityTheme | null {
  return slug !== null && isCommunitySlug(slug) ? THEMES[slug] : null;
}
