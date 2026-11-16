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
    const destination = memoryDestination();
    const logger = createLogger(destination, "info");

    logger.info({ event: "x", userId: "u1", email: "a@b.c", name: "Ana" });

    const output = destination.lines.join("");
    expect(output).toContain('"userId":"u1"');
    expect(output).not.toContain("a@b.c");
    expect(output).not.toContain("Ana");
  });

  it("oculta PII aninhada e dados da autodeclaração", () => {
    const destination = memoryDestination();
    const logger = createLogger(destination, "info");

    logger.info({
      event: "y",
      user: { email: "z@y.x", image: "https://foto" },
      declaration: { autism: true },
      consent: { version: "v1" },
    });

    const output = destination.lines.join("");
    expect(output).toContain('"event":"y"');
    expect(output).not.toContain("z@y.x");
    expect(output).not.toContain("https://foto");
    expect(output).not.toContain("autism");
    expect(output).not.toContain('"v1"');
  });
});
