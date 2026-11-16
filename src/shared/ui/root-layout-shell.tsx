import type { ReactNode } from "react";
import { Logo } from "./logo";

type RootLayoutShellProps = {
  children: ReactNode;
};

export function RootLayoutShell({ children }: RootLayoutShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Logo />
          <span className="text-xl font-bold tracking-tight lowercase">iniciativa</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
