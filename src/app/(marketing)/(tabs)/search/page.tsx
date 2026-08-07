import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/actions";

import { SearchView } from "./search-view";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Search")} — Qura` };
}

export default async function SearchPage() {
  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-4 py-4">
      <PageHeader title={t("Search")} />

      <SearchView />
    </div>
  );
}
