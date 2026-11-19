import type { CSSProperties } from "react";
import { cn } from "@/shared/ui";
import { type CommunityTheme, communityTheme } from "./community-theme";

const sizes = {
  sm: { box: "size-8 rounded-lg", icon: "size-[18px]" },
  md: { box: "size-11 rounded-xl", icon: "size-6" },
} as const;

// As cores vêm do tema por variável CSS: o Tailwind só enxerga classes escritas por inteiro.
export function communityStyle(theme: CommunityTheme): CSSProperties {
  return {
    "--community-bg": theme.background,
    "--community-fg": theme.foreground,
  } as CSSProperties;
}

type CommunityIconProps = { slug: string | null; size?: keyof typeof sizes };

// Só enfeite: quem lê a tela recebe o nome da comunidade pelo texto ao lado (ou pelo
// contexto, como no filtro e na página da comunidade).
export function CommunityIcon({ slug, size = "sm" }: CommunityIconProps) {
  const theme = communityTheme(slug);
  if (!theme) return null;
  const Icon = theme.icon;
  return (
    <span
      aria-hidden="true"
      data-community-icon={slug}
      style={communityStyle(theme)}
      className={`grid shrink-0 place-items-center bg-(--community-bg) text-(--community-fg) ${sizes[size].box}`}
    >
      <Icon className={sizes[size].icon} />
    </span>
  );
}

type CommunityTagProps = { slug: string; name: string; className?: string };

// Etiqueta com o nome escrito: aqui o nome é a informação, e o ícone, só reforço.
export function CommunityTag({ slug, name, className = "" }: CommunityTagProps) {
  const theme = communityTheme(slug);
  if (!theme) return null;
  return (
    <span
      style={communityStyle(theme)}
      className={cn(
        "flex w-fit items-center gap-2 rounded-full bg-(--community-bg) py-1 pr-3 pl-1 font-semibold text-(--community-fg)",
        className,
      )}
    >
      <CommunityIcon slug={slug} />
      {name}
    </span>
  );
}
