import type { ReactNode } from "react";
import { RootLayoutShell } from "@/shared/ui";

// Tela inicial do visitante: mesmo cabeçalho e rodapé das páginas públicas, em largura maior.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <RootLayoutShell width="wide">{children}</RootLayoutShell>;
}
