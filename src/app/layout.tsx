import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { RootLayoutShell } from "@/shared/ui";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "iniciativa",
  description: "Encontros presenciais para jovens autistas em Tubarão-SC.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <RootLayoutShell>{children}</RootLayoutShell>
      </body>
    </html>
  );
}
