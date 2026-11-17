import { meetupsCopy as copy } from "@/modules/meetups/client";

type SeatsBarProps = { occupied: number; capacity: number };

// O texto carrega a informação; a barra é só reforço visual (estática, sem animação).
export function SeatsBar({ occupied, capacity }: SeatsBarProps) {
  const full = occupied >= capacity;
  const percent = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{copy.seatsTaken(occupied, capacity)}</span>
        <span className="font-semibold text-foreground">
          {copy.seatsFree(Math.max(0, capacity - occupied))}
        </span>
      </div>
      <div aria-hidden="true" className="mt-2 h-2.5 overflow-hidden rounded-full bg-tag">
        <div
          className={`h-full rounded-full ${full ? "bg-honey" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
