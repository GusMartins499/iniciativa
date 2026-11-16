import type { PublicMeetup } from "@/modules/meetups/client";
import { appDayKey, formatShortDay, formatWeekday } from "@/shared/time";
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

// Linha do tempo por dia: data e dia da semana à esquerda, encontros do dia à direita.
export function MeetupDays({ meetups, goingIds, createdIds }: MeetupDaysProps) {
  return (
    <div className="flex flex-col gap-6">
      {groupByDay(meetups).map((day) => {
        const first = day.meetups[0];
        if (!first) return null;
        return (
          <section
            key={day.key}
            aria-labelledby={`day-${day.key}`}
            className="grid gap-2 sm:grid-cols-[7.5rem_1fr] sm:gap-6"
          >
            <h2 id={`day-${day.key}`} className="flex items-baseline gap-2 sm:block sm:pt-3.5">
              <span className="block text-[17px] font-bold">{formatShortDay(first.startsAt)}</span>
              <span className="block font-normal text-muted-foreground">
                {formatWeekday(first.startsAt)}
              </span>
            </h2>
            <ul className="flex flex-col gap-3 sm:border-l-2 sm:border-dashed sm:border-border sm:pl-6">
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
