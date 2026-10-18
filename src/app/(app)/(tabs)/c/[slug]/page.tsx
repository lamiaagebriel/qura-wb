import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { CategoryChips } from "@/components/category-chips";
import { Store01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { BusinessList } from "@/components/profile/business-list";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { categoryOf } from "@/lib/categories";
import { getCurrentPlace } from "@/lib/data/places";
import { businessesIn, categoryCounts } from "@/lib/data/businesses";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]">): Promise<Metadata> {
  const [{ locale }, { slug }] = await Promise.all([getTranslations(), params]);
  const category = categoryOf(slug);
  if (!category) return {};
  return {
    title: category.name[locale],
    alternates: { canonical: href("category", { params: { slug } }) },
  };
}

/**
 * A category: its subcategories as chips ("All" first, selected), then
 * every business in it or anywhere under it, in the visitor's city. A chip opens that
 * subcategory the same way, so browsing goes as deep as the tree does.
 * Subcategories without businesses are left out.
 */
export default async function CategoryPage({ params }: PageProps<"/c/[slug]">) {
  const [{ t, locale }, { slug }] = await Promise.all([
    getTranslations(),
    params,
  ]);
  const category = categoryOf(slug);
  if (!category) notFound();
  const city = await getCurrentPlace();
  const [businesses, counts] = await Promise.all([
    businessesIn(slug, city),
    categoryCounts(city),
  ]);
  const children = category.children.filter((c) => counts[c.slug]);

  return (
    <Screen>
      <AppHeader
        title={category.name[locale]}
        large
        back={
          category.parent
            ? href("category", { params: { slug: category.parent } })
            : href("search")
        }
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 pt-4 pb-8">
          {children.length > 0 && (
            <CategoryChips
              label={t("Subcategories")}
              current={slug}
              chips={[
                { slug, name: t("All"), icon: category.icon, count: counts[slug] },
                ...children.map((child) => ({
                  slug: child.slug,
                  name: child.name[locale],
                  icon: child.icon,
                  count: counts[child.slug],
                })),
              ]}
            />
          )}
          <div className="px-4">
            {businesses.length ? (
              <BusinessList businesses={businesses} />
            ) : (
              <StatusScreen
                icon={Store01Icon}
                title={t("No businesses here yet")}
                description={t("Check back soon, or try another category.")}
                inline
              />
            )}
          </div>
        </main>
      </PullToRefresh>
    </Screen>
  );
}
