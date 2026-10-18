import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { waitingTickets } from "@/lib/admin/resources/tickets";
import { requireAdmin } from "@/lib/auth/session";

// Private: every dashboard screen stays out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The super admin dashboard: desktop-first (sidebar + tables), still usable
 * on a phone (the sidebar becomes a sheet). Outside the phone app's shell:
 * no tab bar, no slide transitions. A 404 for everyone but super admins —
 * each page checks again, since a layout isn't re-run on every navigation.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const [waiting, pending, store] = await Promise.all([
    waitingTickets(),
    db.$count(businesses, eq(businesses.status, "pending")),
    cookies(),
  ]);
  const badges = {
    "inbox-requests": waiting.requests + pending,
    "inbox-reports": waiting.reports,
    tickets: waiting.requests + waiting.reports,
  };
  // The sidebar remembers being collapsed (shadcn's own cookie).
  const open = store.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={open}>
      <AdminSidebar badges={badges} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
