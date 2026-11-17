import { describe, expect, it } from "vitest";
import { redactSpanAttributes, redactSpanName } from "./redact-span-attributes";

// Valores sintéticos, nenhum dado real.
describe("shared/observability/redactSpanAttributes", () => {
  it("remove a query string de url.full, http.url e http.target", () => {
    const redacted = redactSpanAttributes({
      "url.full": "https://iniciativa.test/api/auth/callback/google?code=abc&state=xyz",
      "http.url": "https://accounts.exemplo.test/o/oauth2/auth?client_id=1&redirect_uri=x",
      "http.target": "/api/auth/callback/google?code=abc&state=xyz",
      "url.query": "code=abc&state=xyz",
    });

    expect(redacted).toEqual({
      "url.full": "https://iniciativa.test/api/auth/callback/google",
      "http.url": "https://accounts.exemplo.test/o/oauth2/auth",
      "http.target": "/api/auth/callback/google",
    });
    expect(JSON.stringify(redacted)).not.toMatch(/code=|state=/);
  });

  it("remove a query string de qualquer atributo cujo valor é URL ou caminho", () => {
    expect(
      redactSpanAttributes({
        "next.page": "/boas-vindas?token=t",
        "next.route": "/encontros/[id]",
      }),
    ).toEqual({ "next.page": "/boas-vindas", "next.route": "/encontros/[id]" });
  });

  it("remove atributos cujo nome contém name, email, image, token, cookie, password, declaration ou consent", () => {
    const redacted = redactSpanAttributes({
      "user.name": "Ana",
      "user.Email": "ana@exemplo.test",
      "profile.image": "https://foto.exemplo.test/ana.png",
      "auth.token": "tok",
      "http.request.header.cookie": ["sessao=1"],
      password: "senha",
      "onboarding.declaration": true,
      consentVersion: "v1.1",
      "http.status_code": 200,
    });

    expect(redacted).toEqual({ "http.status_code": 200 });
  });

  it("remove atributos enduser.*", () => {
    expect(
      redactSpanAttributes({ "enduser.id": "u1", "enduser.role": "admin", "http.method": "GET" }),
    ).toEqual({ "http.method": "GET" });
  });

  it("mantém userId, meetupId, rsvpId, rotas e status HTTP", () => {
    const kept = {
      userId: "u1",
      meetupId: "m1",
      rsvpId: "r1",
      "next.route": "/encontros/[id]",
      "http.route": "/encontros/[id]",
      "http.method": "POST",
      "http.status_code": 303,
      "http.response.status_code": 303,
    };

    expect(redactSpanAttributes(kept)).toEqual(kept);
  });

  it("não altera o objeto recebido", () => {
    const original = { "url.full": "https://x.test/a?b=1", email: "a@b.test" };
    redactSpanAttributes(original);
    expect(original).toEqual({ "url.full": "https://x.test/a?b=1", email: "a@b.test" });
  });
});

describe("shared/observability/redactSpanName", () => {
  // O span de fetch do @vercel/otel leva a URL completa no nome.
  it("remove a query string das URLs no nome do span", () => {
    expect(redactSpanName("fetch GET https://oauth.exemplo.test/token?code=abc")).toBe(
      "fetch GET https://oauth.exemplo.test/token",
    );
    expect(redactSpanName("GET /encontros/[id]")).toBe("GET /encontros/[id]");
  });
});
