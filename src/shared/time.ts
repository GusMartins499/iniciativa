import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// Fuso único de exibição e de entrada do app (GUIDELINES.md § Best practices).
export const APP_TIME_ZONE = "America/Sao_Paulo";

// "2026-12-05T15:00" no horário de São Paulo → instante UTC.
export function fromAppTime(localDateTime: string): Date {
  return fromZonedTime(localDateTime, APP_TIME_ZONE);
}

export function formatAppDate(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "dd/MM/yyyy");
}

// Valor para <input type="date"> no fuso do app.
export function toAppDateInput(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "yyyy-MM-dd");
}

export function formatAppTime(date: Date): string {
  return formatInTimeZone(date, APP_TIME_ZONE, "HH:mm");
}
