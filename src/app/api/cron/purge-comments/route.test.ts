import { beforeEach, describe, expect, it, vi } from "vitest";

// Segredo curto e legível de propósito (GUIDELINES.md § Security).
const SECRET = "segredo-de-teste-123";

const mocks = vi.hoisted(() => ({
  purgeExpiredComments: vi.fn<(db: unknown, now: Date) => Promise<number>>(),
  info: vi.fn<(entry: object) => void>(),
  warn: vi.fn<(entry: object) => void>(),
  reportError: vi.fn<(error: unknown, context: object) => void>(),
  timingSafeEqual: vi.fn<(a: Uint8Array, b: Uint8Array) => boolean>(),
}));

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  mocks.timingSafeEqual.mockImplementation(actual.timingSafeEqual);
  return { ...actual, timingSafeEqual: mocks.timingSafeEqual };
});
vi.mock("@/modules/comments", () => ({ purgeExpiredComments: mocks.purgeExpiredComments }));
vi.mock("@/shared/db", () => ({ getDb: () => ({}) }));
vi.mock("@/shared/env", () => ({ getServerEnv: () => ({ CRON_SECRET: SECRET }) }));
vi.mock("@/shared/logger", () => ({ logger: { info: mocks.info, warn: mocks.warn } }));
vi.mock("@/shared/observability", () => ({ reportError: mocks.reportError }));

const { GET } = await import("./route");

function request(auth?: string) {
  const headers = new Headers();
  if (auth !== undefined) headers.set("authorization", auth);
  return new Request("http://localhost/api/cron/purge-comments", { headers });
}

describe("rota do job de apagamento de comentários", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.purgeExpiredComments.mockResolvedValue(3);
  });

  it.each([
    ["sem o header", undefined],
    ["com outro segredo", "Bearer outro-segredo-123"],
    ["com o segredo sem o prefixo", SECRET],
    ["com o segredo e sobra", `Bearer ${SECRET}x`],
  ])("%s responde 401 e não apaga nada", async (_case, auth) => {
    const response = await GET(request(auth));

    expect(response.status).toBe(401);
    expect(mocks.purgeExpiredComments).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledWith({ event: "comment.purge_unauthorized" });
  });

  it("com o segredo certo, apaga e responde 200 com a contagem", async () => {
    const response = await GET(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ count: 3 });
    expect(mocks.purgeExpiredComments).toHaveBeenCalledTimes(1);
    expect(mocks.info).toHaveBeenCalledWith({ event: "comment.purged", count: 3 });
    expect(mocks.info).toHaveBeenCalledWith({ event: "comment.purge.completed", count: 3 });
  });

  it("sem nada para apagar, registra a conclusão com count 0", async () => {
    mocks.purgeExpiredComments.mockResolvedValue(0);

    const response = await GET(request(`Bearer ${SECRET}`));

    expect(await response.json()).toEqual({ count: 0 });
    expect(mocks.info).toHaveBeenCalledWith({ event: "comment.purge.completed", count: 0 });
    expect(mocks.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "comment.purged" }),
    );
  });

  it("compara o segredo em tempo constante", async () => {
    await GET(request(`Bearer ${SECRET}`));

    expect(mocks.timingSafeEqual).toHaveBeenCalled();
  });

  it("falha inesperada vai para o reportError e responde 500", async () => {
    const failure = new Error("banco fora do ar");
    mocks.purgeExpiredComments.mockRejectedValue(failure);

    const response = await GET(request(`Bearer ${SECRET}`));

    expect(response.status).toBe(500);
    expect(mocks.reportError).toHaveBeenCalledWith(failure, { event: "comment.purge_failed" });
    expect(mocks.info).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "comment.purge.completed" }),
    );
  });
});
