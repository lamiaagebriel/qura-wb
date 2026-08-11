import type { Metadata } from "next";

import { getLocale } from "@/lib/i18n/actions";

import { SearchView } from "./search-view";
import { AppHeader } from "@/components/app-header";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Search")} — Qura` };
}

export default async function SearchPage() {
  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-4 py-4">
      {/* A bottom-nav root tab, same as Feed/Favorites — no back button,
          since there's no single "parent" screen to return to. */}
      <AppHeader title={t("Search")} showBack={false} />

      <SearchView />
    </div>
  );
}
