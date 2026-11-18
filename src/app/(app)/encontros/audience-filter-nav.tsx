import Link from "next/link";
import { type AudienceFilter, meetupsCopy } from "@/modules/meetups/client";
import { cn } from "@/shared/ui/cn";
import type { AudienceFilterOption } from "./audience";

type AudienceFilterNavProps = {
  options: AudienceFilterOption[];
  current: AudienceFilter;
};

// Links, não botões: o filtro funciona sem JS no cliente e a escolha fica na URL.
export function AudienceFilterNav({ options, current }: AudienceFilterNavProps) {
  return (
    <nav aria-label={meetupsCopy.filter.label}>
      <ul className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isCurrent = option.filter === current;
          return (
            <li key={option.filter}>
              <Link
                href={option.href}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 font-semibold",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface hover:border-border-strong",
                )}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
