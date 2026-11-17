import Link from "next/link";
import type { ReactNode } from "react";
import { layoutCopy } from "./copy";
import { Logo } from "./logo";

type RootLayoutShellProps = {
  children: ReactNode;
  // Navegação das páginas autenticadas; as páginas públicas mostram só a marca.
  nav?: ReactNode;
};

// O ano exibido segue o fuso do produto, não o do servidor (a Vercel roda em UTC).
function currentYearInSaoPaulo() {
  return Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(
      new Date(),
    ),
  );
}

export function RootLayoutShell({ children, nav }: RootLayoutShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Faixa de mel no topo: identidade da marca sem distrair (sem animação). */}
      <div className="border-t-4 border-honey border-b border-b-border bg-surface">
        <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-md">
            <Logo />
            <span className="text-xl font-bold tracking-tight lowercase">iniciativa</span>
          </Link>
          {nav}
        </header>
      </div>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-16">{children}</main>
      <footer className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-border px-4 py-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="font-semibold text-foreground lowercase">
            {layoutCopy.footer.productName}
          </span>
        </div>
        <p>{layoutCopy.footer.copyright(currentYearInSaoPaulo())}</p>
      </footer>
    </div>
  );
}
