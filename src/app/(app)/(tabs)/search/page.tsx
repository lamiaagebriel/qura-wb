import type { Metadata } from "next";

import { Screen } from "@/components/navigation/screen";
import { SearchView } from "@/components/search/search-view";
import { getCurrentPlace } from "@/lib/data/places";
import { categoryCounts, searchBusinesses } from "@/lib/data/businesses";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t("Search"), alternates: { canonical: href("search") } };
}

/** `?q=` is the current search, so going back to Search restores it. */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";

  const [results, counts] = await Promise.all([
    query ? searchBusinesses(query) : [],
    getCurrentPlace().then(categoryCounts),
  ]);

  return (
    <Screen>
      <SearchView
        categoryCounts={counts}
        initialQuery={query}
        initialResults={results}
      />
    </Screen>
  );
}
