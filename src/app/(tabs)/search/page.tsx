import type { Metadata } from "next";

import { Screen } from "@/components/navigation/screen";
import { SearchView } from "@/components/search/search-view";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Search"), alternates: { canonical: href("search") } };
}

export default function SearchPage() {
  return (
    <Screen>
      <SearchView />
    </Screen>
  );
}
