import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "@/shared/ui/logo";

const iconSvg = readFileSync(fileURLToPath(new URL("./icon.svg", import.meta.url)), "utf8");
const appleIcon = readFileSync(fileURLToPath(new URL("./apple-icon.png", import.meta.url)));

const polygonsOf = (svg: string) =>
  [...svg.matchAll(/<polygon points="([^"]+)" fill="([^"]+)"/g)].map(([, points, fill]) => ({
    points,
    fill,
  }));

describe("ícones do app", () => {
  it("usa as mesmas cores do componente Logo", () => {
    expect(iconSvg).toContain("#334155");
    expect(iconSvg).toContain("#F59E0B");
  });

  it("desenha os mesmos polígonos do componente Logo", () => {
    const logoSvg = renderToStaticMarkup(createElement(Logo));

    expect(iconSvg).toContain('viewBox="0 0 32 32"');
    expect(polygonsOf(iconSvg)).toEqual(polygonsOf(logoSvg));
    expect(polygonsOf(iconSvg)).toHaveLength(2);
  });

  it("tem o ícone de atalho para iOS em PNG de 180×180", () => {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(appleIcon.subarray(0, 8)).toEqual(pngSignature);
    // O cabeçalho IHDR guarda largura e altura nos bytes 16–23.
    expect(appleIcon.readUInt32BE(16)).toBe(180);
    expect(appleIcon.readUInt32BE(20)).toBe(180);
  });
});
