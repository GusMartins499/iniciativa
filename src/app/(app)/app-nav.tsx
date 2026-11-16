"use client";

import { CalendarDays, CircleCheck, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navCopy as copy } from "./copy";

const links = [
  { href: "/encontros", label: copy.meetups, Icon: CalendarDays },
  { href: "/meus-encontros", label: copy.myMeetups, Icon: CircleCheck },
] as const;

function isCurrent(pathname: string, href: string): boolean {
  // "Criar encontro" tem botão próprio: não marca "Encontros" como página atual.
  if (pathname === "/encontros/novo") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type AppNavProps = { userInitial: string };

// No celular o contêiner usa display: contents: marca e ações ficam na mesma linha e a
// navegação desce para a linha de baixo (order-last + w-full).
export function AppNav({ userInitial }: AppNavProps) {
  const pathname = usePathname();
  return (
    <div className="contents sm:flex sm:flex-1 sm:items-center sm:justify-end sm:gap-2">
      <nav
        aria-label={copy.label}
        className="order-last w-full sm:order-none sm:mr-auto sm:w-auto sm:pl-4"
      >
        <ul className="flex gap-1">
          {links.map(({ href, label, Icon }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 font-medium ${
                    current
                      ? "bg-surface/80 text-foreground ring-1 ring-border ring-inset"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-[18px]" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Link
        href="/encontros/novo"
        aria-label={copy.createMeetup}
        className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary-hover sm:ml-0 sm:px-4"
      >
        <Plus aria-hidden="true" className="size-[18px]" />
        <span className="hidden sm:inline">{copy.createMeetup}</span>
      </Link>
      <Link
        href="/conta"
        aria-label={copy.account}
        aria-current={pathname === "/conta" ? "page" : undefined}
        className="grid size-11 place-items-center rounded-full bg-primary font-bold text-primary-foreground"
      >
        {userInitial}
      </Link>
    </div>
  );
}
