import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ComingSoon } from "@/components/coming-soon";
import { CATEGORY_META, isBusinessCategory } from "@/lib/categories";
import { getActiveCity } from "@/lib/city/actions";
import { CITY_LABEL, isCityAvailable } from "@/lib/city/cities";
import { getLocale } from "@/lib/i18n/actions";
import { getCategoryDiscovery } from "@/lib/search/category-discovery";

import { CategoryResults } from "./category-results";

type CategoryPageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const { t } = await getLocale();
  return {
    title: isBusinessCategory(category)
      ? `${t(CATEGORY_META[category].label)} — Qura`
      : "Qura",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  if (!isBusinessCategory(category)) notFound();

  const [{ t }, city] = await Promise.all([getLocale(), getActiveCity()]);
  const available = isCityAvailable(city);
  // First page only — `CategoryResults` (client) owns every page after
  // this one via its own "Load more" button and `loadMoreCategoryDiscoveryAction`.
  const firstPage = available
    ? await getCategoryDiscovery({ category, city })
    : { items: [], nextCursor: null };

  return (
    <div className="flex flex-col gap-2 py-4">
      <AppHeader
        title={t(CATEGORY_META[category].label)}
        backHref="/categories"
      />

      {!available && (
        <ComingSoon title={t(CITY_LABEL[city])} description={t("Coming soon")} />
      )}

      {available && (
        <CategoryResults
          category={category}
          initialItems={firstPage.items}
          initialCursor={firstPage.nextCursor}
          activeCity={city}
        />
      )}
    </div>
  );
}
