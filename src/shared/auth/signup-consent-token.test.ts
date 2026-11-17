import { describe, expect, it } from "vitest";
import {
  createSignupConsentToken,
  readCookie,
  SIGNUP_CONSENT_MAX_AGE_SECONDS,
  verifySignupConsentToken,
} from "./signup-consent-token";

// Mesmo formato da versão real do termo (CONSENT_VERSION em modules/users): tem pontos.
const CONSENT_VERSION = "v0.1-provisorio";
const secret = "segredo-sintetico-de-teste";
const issuedAt = new Date("2026-11-17T12:00:00.000Z");
const later = (seconds: number) => new Date(issuedAt.getTime() + seconds * 1000);

describe("aceite dos termos antes do cadastro", () => {
  it("aceita o token recém-emitido, com a mesma versão do termo", () => {
    const token = createSignupConsentToken(secret, "v1", issuedAt);
    expect(verifySignupConsentToken(token, secret, { now: later(60), version: "v1" })).toBe(true);
  });

  it("aceita a versão real do termo, que tem pontos", () => {
    const token = createSignupConsentToken(secret, CONSENT_VERSION, issuedAt);
    expect(
      verifySignupConsentToken(token, secret, { now: later(60), version: CONSENT_VERSION }),
    ).toBe(true);
    // Sem versão pedida (o hook do Better Auth) também precisa aceitar.
    expect(verifySignupConsentToken(token, secret, { now: later(60) })).toBe(true);
  });

  it("recusa o token vencido", () => {
    const token = createSignupConsentToken(secret, "v1", issuedAt);
    const expired = later(SIGNUP_CONSENT_MAX_AGE_SECONDS + 1);
    expect(verifySignupConsentToken(token, secret, { now: expired })).toBe(false);
  });

  it("recusa o token assinado com outro segredo ou alterado", () => {
    const token = createSignupConsentToken(secret, "v1", issuedAt);
    expect(verifySignupConsentToken(token, "outro-segredo", { now: later(1) })).toBe(false);
    const tampered = token.replace(String(issuedAt.getTime()), String(later(5).getTime()));
    expect(verifySignupConsentToken(tampered, secret, { now: later(10) })).toBe(false);
  });

  it("recusa o aceite de outra versão do termo", () => {
    const token = createSignupConsentToken(secret, "v1", issuedAt);
    expect(verifySignupConsentToken(token, secret, { now: later(1), version: "v2" })).toBe(false);
  });

  it("recusa a ausência de token e lixo", () => {
    expect(verifySignupConsentToken(undefined, secret)).toBe(false);
    expect(verifySignupConsentToken("nada", secret)).toBe(false);
  });

  it("lê o cookie do cabeçalho cru", () => {
    expect(
      readCookie("a=1; iniciativa.signup-consent=x.y.z; b=2", "iniciativa.signup-consent"),
    ).toBe("x.y.z");
    expect(readCookie(undefined, "iniciativa.signup-consent")).toBeUndefined();
  });
});
