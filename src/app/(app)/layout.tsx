import type { ReactNode } from "react";
import { RootLayoutShell } from "@/shared/ui";
import { AppNav } from "./app-nav";
import { requirePageUser } from "./require-page-user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const currentUser = await requirePageUser();
  const user = { name: currentUser.name, image: currentUser.image };
  return <RootLayoutShell nav={<AppNav user={user} />}>{children}</RootLayoutShell>;
}
