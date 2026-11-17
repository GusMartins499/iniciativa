import { describe, expect, it } from "vitest";
import { config } from "./proxy";

const [matcher] = config.matcher;
const passesThroughProxy = (path: string) => new RegExp(`^${matcher}$`).test(path);

describe("proxy de sessão", () => {
  it("não intercepta os ícones do app, que a aba pede mesmo sem login", () => {
    expect(passesThroughProxy("/icon.svg")).toBe(false);
    expect(passesThroughProxy("/apple-icon.png")).toBe(false);
  });

  it("deixa a política de privacidade aberta sem login", () => {
    expect(passesThroughProxy("/privacidade")).toBe(false);
  });

  it("continua protegendo as rotas do app", () => {
    expect(passesThroughProxy("/encontros")).toBe(true);
    expect(passesThroughProxy("/")).toBe(true);
  });
});
