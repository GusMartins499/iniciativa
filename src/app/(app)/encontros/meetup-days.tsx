import type { PublicMeetup } from "@/modules/meetups/client";
import {
  appDayKey,
  formatDayNumber,
  formatMonthShort,
  formatShortDay,
  formatWeekday,
} from "@/shared/time";
import { MeetupCard } from "./meetup-card";

type MeetupDaysProps = {
  meetups: PublicMeetup[];
  goingIds?: ReadonlySet<string>;
  createdIds?: ReadonlySet<string>;
};

export function groupByDay(meetups: PublicMeetup[]): { key: string; meetups: PublicMeetup[] }[] {
  const groups = new Map<string, PublicMeetup[]>();
  for (const meetup of meetups) {
    const key = appDayKey(meetup.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), meetup]);
  }
  return [...groups].map(([key, items]) => ({ key, meetups: items }));
}

// Linha do tempo por dia: folhinha de calendário à esquerda, encontros do dia à direita.
// A folhinha é só visual; o leitor de tela recebe a data por extenso.
export function MeetupDays({ meetups, goingIds, createdIds }: MeetupDaysProps) {
  return (
    <div className="flex flex-col gap-8">
      {groupByDay(meetups).map((day) => {
        const first = day.meetups[0];
        if (!first) return null;
        return (
          <section
            key={day.key}
            aria-labelledby={`day-${day.key}`}
            className="grid gap-3 sm:grid-cols-[5.5rem_1fr] sm:gap-6"
          >
            <h2
              id={`day-${day.key}`}
              className="flex items-center gap-3 sm:flex-col sm:items-stretch"
            >
              <span className="sr-only">
                {formatShortDay(first.startsAt)} {formatWeekday(first.startsAt)}
              </span>
              <span
                aria-hidden="true"
                className="flex w-16 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface text-center shadow-sm sm:w-full"
              >
                <span className="bg-primary py-0.5 text-xs font-semibold tracking-wider text-primary-foreground uppercase">
                  {formatMonthShort(first.startsAt)}
                </span>
                <span className="py-1 text-2xl leading-tight font-bold tabular-nums sm:text-3xl">
                  {formatDayNumber(first.startsAt)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-sm font-medium text-muted-foreground first-letter:uppercase sm:text-center"
              >
                {formatWeekday(first.startsAt)}
              </span>
            </h2>
            <ul className="flex flex-col gap-3">
              {day.meetups.map((meetup) => (
                <li key={meetup.id}>
                  <MeetupCard
                    meetup={meetup}
                    going={goingIds?.has(meetup.id)}
                    created={createdIds?.has(meetup.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
