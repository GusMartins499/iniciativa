import type { ReactNode } from "react";
import { RootLayoutShell } from "@/shared/ui";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <RootLayoutShell>{children}</RootLayoutShell>;
}
