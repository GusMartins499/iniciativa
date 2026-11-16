import { describe, expect, it } from "vitest";
import { err, ok } from "./result";

describe("shared/result", () => {
  it("ok() devolve sucesso com os dados", () => {
    const dado = { id: "m1" };
    const r = ok(dado);
    expect(r).toEqual({ ok: true, data: { id: "m1" } });
  });

  it("err() devolve falha com o código", () => {
    const r = err("MEETUP_FULL");
    expect(r).toEqual({ ok: false, error: { code: "MEETUP_FULL" } });
  });
});
