import { createHmac, timingSafeEqual } from "node:crypto";

// Parte pura do aceite assinado (sem next/headers): o hook do Better Auth em auth.ts a usa,
// e auth.ts também roda fora do Next, no global-setup do e2e.

export const SIGNUP_CONSENT_COOKIE = "iniciativa.signup-consent";
export const SIGNUP_CONSENT_MAX_AGE_SECONDS = 15 * 60;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSignupConsentToken(
  secret: string,
  version: string,
  now = new Date(),
): string {
  // base64url não tem ".": a versão do termo tem pontos ("v0.1-...") e quebraria o formato.
  const payload = `${Buffer.from(version).toString("base64url")}.${now.getTime()}`;
  return `${payload}.${sign(payload, secret)}`;
}

type VerifyOptions = { now?: Date; version?: string };

// Válido quando a assinatura confere, não passou do prazo e (se pedida) a versão bate.
export function verifySignupConsentToken(
  token: string | undefined,
  secret: string,
  { now = new Date(), version }: VerifyOptions = {},
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [encodedVersion, issuedAt, signature] = parts as [string, string, string];
  const expected = Buffer.from(sign(`${encodedVersion}.${issuedAt}`, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  const age = now.getTime() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SIGNUP_CONSENT_MAX_AGE_SECONDS * 1000) return false;
  return version === undefined || Buffer.from(encodedVersion, "base64url").toString() === version;
}

// Lê um cookie do cabeçalho Cookie cru (o hook do Better Auth recebe só os headers).
export function readCookie(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}
