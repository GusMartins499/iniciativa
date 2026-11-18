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
  it("usa as cores da marca: azul-tinta no hexágono e mel na face", () => {
    expect(polygonsOf(iconSvg).map((polygon) => polygon.fill)).toEqual(["#2F3D8F", "#F5A524"]);
  });

  it("desenha o d20 visto de frente: hexágono com a face em triângulo", () => {
    const [outline, face] = polygonsOf(iconSvg);

    expect(outline?.points?.split(" ")).toHaveLength(6);
    expect(face?.points?.split(" ")).toHaveLength(3);
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
