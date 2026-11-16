import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

function memoryDestination() {
  const lines: string[] = [];
  return {
    lines,
    write(chunk: string) {
      lines.push(chunk);
    },
  };
}

describe("shared/logger", () => {
  it("oculta campos de PII no log", () => {
    const destino = memoryDestination();
    const logger = createLogger(destino);

    logger.info({ event: "x", userId: "u1", email: "a@b.c", name: "Ana" });

    const saida = destino.lines.join("");
    expect(saida).toContain('"userId":"u1"');
    expect(saida).not.toContain("a@b.c");
    expect(saida).not.toContain("Ana");
  });

  it("oculta PII aninhada e dados da autodeclaração", () => {
    const destino = memoryDestination();
    const logger = createLogger(destino);

    logger.info({
      event: "y",
      user: { email: "z@y.x", image: "https://foto" },
      declaration: { autism: true },
      consent: { version: "v1" },
    });

    const saida = destino.lines.join("");
    expect(saida).toContain('"event":"y"');
    expect(saida).not.toContain("z@y.x");
    expect(saida).not.toContain("https://foto");
    expect(saida).not.toContain("autism");
    expect(saida).not.toContain('"v1"');
  });
});
