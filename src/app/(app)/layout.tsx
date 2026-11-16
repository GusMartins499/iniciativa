import type { ReactNode } from "react";
import { RootLayoutShell } from "@/shared/ui";
import { AppNav } from "./app-nav";
import { requirePageUser } from "./require-page-user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const currentUser = await requirePageUser();
  const userInitial = currentUser.name.trim().charAt(0).toUpperCase() || "?";
  return <RootLayoutShell nav={<AppNav userInitial={userInitial} />}>{children}</RootLayoutShell>;
}
