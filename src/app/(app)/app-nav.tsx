"use client";

import { CalendarDays, CircleCheck, Hexagon, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/shared/ui";
import { navCopy as copy } from "./copy";

const links = [
  { href: "/encontros", label: copy.meetups, Icon: CalendarDays },
  { href: "/meus-encontros", label: copy.myMeetups, Icon: CircleCheck },
  { href: "/comunidades", label: copy.communities, Icon: Hexagon },
] as const;

// Base comum dos três botões da barra: mesma altura, recuo, raio e peso de fonte.
const navButton =
  "inline-flex h-11 items-center gap-2 rounded-md px-4 font-semibold md:whitespace-nowrap";

function isCurrent(pathname: string, href: string): boolean {
  // "Criar encontro" tem botão próprio: não marca "Próximos" como página atual.
  if (pathname === "/encontros/novo") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type AppNavProps = { user: { name: string; image: string | null } };

// Com 3 itens, abaixo de md os links ficam só com o texto e "Criar encontro" só com o ícone,
// para a barra caber sem rolagem horizontal (de 375 px até a largura do container).
// No celular o contêiner usa display: contents: marca e ações ficam na mesma linha e a
// navegação desce para a linha de baixo (order-last + w-full).
export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  return (
    <div className="contents sm:flex sm:flex-1 sm:items-center sm:justify-end sm:gap-2">
      <nav aria-label={copy.label} className="order-last w-full sm:order-none sm:mr-auto sm:w-auto">
        <ul className="flex gap-1">
          {links.map(({ href, label, Icon }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`${navButton} max-md:px-3 ${
                    current
                      ? "bg-honey-light text-honey-light-foreground"
                      : "text-muted-foreground hover:bg-tag hover:text-foreground"
                  }`}
                >
                  <Icon aria-hidden="true" className="size-[18px] max-md:hidden" />
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
        className={`${navButton} ml-auto bg-primary text-primary-foreground hover:bg-primary-hover max-md:px-3 sm:ml-0`}
      >
        <Plus aria-hidden="true" className="size-[18px]" />
        <span className="hidden md:inline">{copy.createMeetup}</span>
      </Link>
      <Link
        href="/conta"
        aria-label={copy.account}
        aria-current={pathname === "/conta" ? "page" : undefined}
        className="rounded-full"
      >
        <Avatar name={user.name} image={user.image} className="size-11" />
      </Link>
    </div>
  );
}
