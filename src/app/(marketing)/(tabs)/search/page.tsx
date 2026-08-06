import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/actions";

import { SearchView } from "./search-view";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Search")} — Qura` };
}

export default async function SearchPage() {
  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="container px-4">
        <h1 className="text-foreground text-[20px] font-bold tracking-tight">
          {t("Search")}
        </h1>
      </div>
      <SearchView />
    </div>
  );
}
