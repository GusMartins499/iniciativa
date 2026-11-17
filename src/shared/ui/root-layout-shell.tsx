import Link from "next/link";
import type { ReactNode } from "react";
import { layoutCopy } from "./copy";
import { Logo } from "./logo";

type RootLayoutShellProps = {
  children: ReactNode;
  // Navegação das páginas autenticadas; as páginas públicas mostram só a marca.
  nav?: ReactNode;
  // "narrow" (padrão) para formulários e listas. "wide" é a tela inicial: cabeçalho e rodapé
  // largos, e o conteúdo ocupa a tela de ponta a ponta (cada seção define a própria largura).
  width?: "narrow" | "wide";
};

const maxWidth = { narrow: "max-w-3xl", wide: "max-w-6xl" } as const;

// O ano exibido segue o fuso do produto, não o do servidor (a Vercel roda em UTC).
function currentYearInSaoPaulo() {
  return Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(
      new Date(),
    ),
  );
}

export function RootLayoutShell({ children, nav, width = "narrow" }: RootLayoutShellProps) {
  const container = `mx-auto w-full ${maxWidth[width]} px-4`;
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Faixa de mel no topo: identidade da marca sem distrair (sem animação). */}
      <div className="border-t-4 border-honey border-b border-b-border bg-surface">
        <header className={`${container} flex flex-wrap items-center justify-between gap-3 py-3`}>
          <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-md">
            <Logo />
            <span className="text-xl font-bold tracking-tight lowercase">iniciativa</span>
          </Link>
          {nav}
        </header>
      </div>
      <main className={width === "wide" ? "w-full flex-1" : `${container} flex-1 pt-8 pb-16`}>
        {children}
      </main>
      {/* A linha de cima ocupa a largura toda, como a do cabeçalho; o conteúdo segue o container. */}
      <footer className="border-t border-border">
        <div
          className={`${container} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-6 text-sm text-muted-foreground`}
        >
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-semibold text-foreground lowercase">
              {layoutCopy.footer.productName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/privacidade" className="inline-flex min-h-11 items-center underline">
              {layoutCopy.footer.privacy}
            </Link>
            <p>{layoutCopy.footer.copyright(currentYearInSaoPaulo())}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
