import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("./globals.css", import.meta.url)), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/gi)].map(([, name, hex]) => [name, hex]),
);

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

// Pares texto/fundo que as telas usam (classes text-* sobre bg-*).
const textPairs: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "surface"],
  ["muted-foreground", "background"],
  ["muted-foreground", "surface"],
  ["primary", "background"],
  ["primary-foreground", "primary"],
  ["primary-foreground", "primary-hover"],
  ["tag-foreground", "tag"],
  ["honey-light-foreground", "honey-light"],
  ["honey-light-foreground", "background"],
  ["honey-light-foreground", "surface"],
  ["foreground", "honey"],
  ["foreground", "honey-hover"],
  ["honey", "primary-hover"],
];

describe("paleta da marca", () => {
  it("tem contraste WCAG 2.1 AA (4,5:1) em todo par de texto e fundo usado nas telas", () => {
    const failing = textPairs
      .filter(([text, background]) => {
        const [fg, bg] = [tokens[text], tokens[background]];
        return !fg || !bg || contrast(fg, bg) < 4.5;
      })
      .map(([text, background]) => `${text} sobre ${background}`);

    expect(failing).toEqual([]);
  });
});
