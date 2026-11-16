import { differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
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

function inAppZone(date: Date, pattern: string): string {
  return formatInTimeZone(date, APP_TIME_ZONE, pattern, { locale: ptBR });
}

// Chave do dia no fuso do app, para agrupar encontros por data.
export function appDayKey(date: Date): string {
  return inAppZone(date, "yyyy-MM-dd");
}

// "5 de dez."
export function formatShortDay(date: Date): string {
  return inAppZone(date, "d 'de' MMM'.'");
}

// "sábado"
export function formatWeekday(date: Date): string {
  return inAppZone(date, "EEEE");
}

// "Sábado, 5 de dezembro de 2026"
export function formatLongDate(date: Date): string {
  const text = inAppZone(date, "EEEE, d 'de' MMMM 'de' yyyy");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "15h", "17h30"
function formatHour(date: Date): string {
  const minutes = inAppZone(date, "mm");
  return `${inAppZone(date, "H")}h${minutes === "00" ? "" : minutes}`;
}

// "15h – 17h"
export function formatHourRange(start: Date, end: Date): string {
  return `${formatHour(start)} – ${formatHour(end)}`;
}

// "2 horas", "1 hora e 30 minutos", "45 minutos"
export function formatDuration(start: Date, end: Date): string {
  const total = differenceInMinutes(end, start);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const parts = [
    hours > 0 ? `${hours} ${hours === 1 ? "hora" : "horas"}` : null,
    minutes > 0 ? `${minutes} ${minutes === 1 ? "minuto" : "minutos"}` : null,
  ].filter(Boolean);
  return parts.join(" e ");
}
