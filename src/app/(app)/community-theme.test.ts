import { describe, expect, it } from "vitest";
import { COMMUNITIES } from "@/modules/communities/client";
import { communityTheme } from "./community-theme";

// Razão de contraste do WCAG 2.1 (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio).
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((value) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe("cor e ícone de cada comunidade", () => {
  it("dá cor e ícone às 9 comunidades", () => {
    for (const community of COMMUNITIES) {
      const theme = communityTheme(community.slug);
      expect(theme).not.toBeNull();
      expect(theme?.background).toMatch(/^#[0-9A-F]{6}$/);
      expect(theme?.foreground).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("não repete cor nem ícone entre comunidades", () => {
    const themes = COMMUNITIES.map((community) => communityTheme(community.slug));
    expect(new Set(themes.map((theme) => theme?.background)).size).toBe(COMMUNITIES.length);
    expect(new Set(themes.map((theme) => theme?.foreground)).size).toBe(COMMUNITIES.length);
    expect(new Set(themes.map((theme) => theme?.icon)).size).toBe(COMMUNITIES.length);
  });

  it("tem contraste WCAG 2.1 AA (4,5:1) entre o texto e o fundo suave, e do texto no branco", () => {
    const failing = COMMUNITIES.filter((community) => {
      const theme = communityTheme(community.slug);
      if (!theme) return true;
      return (
        contrast(theme.foreground, theme.background) < 4.5 ||
        contrast(theme.foreground, "#FFFFFF") < 4.5
      );
    }).map((community) => community.slug);

    expect(failing).toEqual([]);
  });

  it("não tem tema para encontro aberto nem para slug fora da lista", () => {
    expect(communityTheme(null)).toBeNull();
    expect(communityTheme("xadrez")).toBeNull();
  });
});
