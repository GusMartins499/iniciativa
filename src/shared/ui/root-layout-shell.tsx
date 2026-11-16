import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./logo";

type RootLayoutShellProps = {
  children: ReactNode;
  // Navegação das páginas autenticadas; as páginas públicas mostram só a marca.
  nav?: ReactNode;
};

export function RootLayoutShell({ children, nav }: RootLayoutShellProps) {
  return (
    // Faixa suave de mel no topo: identidade da marca sem distrair (sem animação).
    <div className="min-h-screen bg-background bg-[linear-gradient(180deg,var(--color-honey-light)_0%,transparent_320px)] text-foreground">
      <header className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-md">
          <Logo />
          <span className="text-xl font-bold tracking-tight lowercase">iniciativa</span>
        </Link>
        {nav}
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-12">{children}</main>
    </div>
  );
}
