import type { Metadata } from "next";

import { AdminPage } from "@/components/admin/admin-page";
import { TicketInbox } from "@/components/admin/ticket-inbox";
import { requireAdmin } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Reports") };
}

/** Every open report (posts, reviews, businesses, people), oldest first. */
export default async function AdminReportsPage() {
  const admin = await requireAdmin();
  const { t } = await getTranslations();
  return (
    <AdminPage title={t("Reports")}>
      <TicketInbox kind="report" adminId={admin.id} />
    </AdminPage>
  );
}
