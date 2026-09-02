import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";

import { getGuardedAdmin } from "@/lib/auth/guard";

/**
 * The only gate on `/admin/*` — every page and action underneath this
 * still re-checks `getGuardedAdmin` itself (server actions are callable
 * directly, not just through whatever page links to them), but this is
 * what keeps a non-admin from ever rendering an admin page in the first
 * place. Not a parallel admin system: this is the first and only one —
 * no admin routes existed before Phase 5.
 */
export default async function AdminLayout({ children }: PropsWithChildren) {
  const admin = await getGuardedAdmin();
  if (!admin) redirect("/");

  return <div className="container flex flex-col gap-4 px-4 py-6">{children}</div>;
}
