import { AlignLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { meetupsCopy as copy, type PublicMeetup } from "@/modules/meetups/client";
import { formatDuration, formatHourRange, formatLongDate } from "@/shared/time";

function Fact({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3.5 py-3.5 [&+&]:border-t [&+&]:border-border">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-lg bg-honey-light text-honey-light-foreground"
      >
        {icon}
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        {children ? <div className="text-muted-foreground">{children}</div> : null}
      </div>
    </li>
  );
}

// O endereço é público (está no encontro): a busca no mapa não expõe dado pessoal.
function mapUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Tubarão - SC`)}`;
}

export function MeetupFacts({ meetup }: { meetup: PublicMeetup }) {
  const iconClass = "size-[18px]";
  return (
    <ul className="rounded-xl border border-border bg-surface px-4 sm:px-5">
      <Fact icon={<CalendarDays className={iconClass} />} title={formatLongDate(meetup.startsAt)} />
      <Fact
        icon={<Clock className={iconClass} />}
        title={formatHourRange(meetup.startsAt, meetup.endsAt)}
      >
        {formatDuration(meetup.startsAt, meetup.endsAt)}
      </Fact>
      <Fact icon={<MapPin className={iconClass} />} title={meetup.address}>
        <a href={mapUrl(meetup.address)} className="inline-flex min-h-11 items-center underline">
          {copy.mapLink}
        </a>
      </Fact>
      {meetup.placeDescription ? (
        <Fact icon={<AlignLeft className={iconClass} />} title={copy.aboutPlace}>
          {meetup.placeDescription}
        </Fact>
      ) : null}
    </ul>
  );
}
