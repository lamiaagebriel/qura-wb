import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/admin-page";
import { TicketInbox } from "@/components/admin/ticket-inbox";
import { requireAdmin } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Requests") };
}

/** Everything waiting for an answer: new businesses, then requests. */
export default async function AdminRequestsPage() {
  const admin = await requireAdmin();
  const { t } = await getTranslations();
  return (
    <AdminPage title={t("Requests")}>
      <TicketInbox kind="request" adminId={admin.id} />
    </AdminPage>
  );
}
