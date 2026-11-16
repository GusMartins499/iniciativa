import { describe, expect, it } from "vitest";
import {
  appDayKey,
  formatDuration,
  formatHourRange,
  formatLongDate,
  formatShortDay,
  formatWeekday,
} from "./time";

// 05/12/2026 15:00 e 17:30 em São Paulo (UTC-3).
const start = new Date("2026-12-05T18:00:00.000Z");
const end = new Date("2026-12-05T20:30:00.000Z");

describe("shared/time", () => {
  it("formata o dia curto e o dia da semana em pt-BR", () => {
    expect(formatShortDay(start)).toBe("5 de dez.");
    expect(formatWeekday(start)).toBe("sábado");
  });

  it("formata a data longa com inicial maiúscula", () => {
    expect(formatLongDate(start)).toBe("Sábado, 5 de dezembro de 2026");
  });

  it("formata o intervalo de horas sem minutos zerados", () => {
    expect(formatHourRange(start, end)).toBe("15h – 17h30");
  });

  it("formata a duração por extenso", () => {
    expect(formatDuration(start, end)).toBe("2 horas e 30 minutos");
    expect(formatDuration(start, new Date("2026-12-05T19:00:00.000Z"))).toBe("1 hora");
  });

  it("agrupa pelo dia de São Paulo, não pelo dia UTC", () => {
    // 23:30 em São Paulo ainda é dia 5, mesmo já sendo dia 6 em UTC.
    expect(appDayKey(new Date("2026-12-06T02:30:00.000Z"))).toBe("2026-12-05");
  });
});
