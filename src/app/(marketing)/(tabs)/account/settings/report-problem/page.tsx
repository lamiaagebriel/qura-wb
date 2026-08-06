import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getGuardedUser } from "@/lib/auth/guard";
import { getLocale } from "@/lib/i18n/actions";

import { ReportProblemForm } from "./report-problem-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Report a problem")} — Qura` };
}

export default async function ReportProblemPage() {
  const user = await getGuardedUser();
  if (!user) redirect("/login");

  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("Report a problem")} />
      <div className="container px-4">
        <ReportProblemForm />
      </div>
    </div>
  );
}
