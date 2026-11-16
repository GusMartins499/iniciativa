import { meetupsCopy as copy } from "@/modules/meetups/client";

type SeatsBarProps = { occupied: number; capacity: number };

// O texto carrega a informação; a barra é só reforço visual (estática, sem animação).
export function SeatsBar({ occupied, capacity }: SeatsBarProps) {
  const full = occupied >= capacity;
  const percent = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm text-muted-foreground">
        <span>{copy.seatsTaken(occupied, capacity)}</span>
        <span>{copy.seatsFree(Math.max(0, capacity - occupied))}</span>
      </div>
      <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-tag">
        <div
          className={`h-full ${full ? "bg-honey" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
