import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { Store01Icon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Screen } from "@/components/navigation/screen";
import { BusinessList } from "@/components/profile/business-list";
import {
  fakeBusinessesIn,
  fakeCategoryCounts,
} from "@/components/profile/fake-businesses";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { categoryOf } from "@/lib/categories";
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
 * every business in it or anywhere under it. A chip opens that
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
  // TEMPORARY: fake businesses until businesses are stored.
  const businesses = fakeBusinessesIn(slug);
  const counts = fakeCategoryCounts();
  const children = category.children.filter((c) => counts[c.slug]);
  const chip =
    "flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium ring-1 ring-foreground/10";

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
            <nav
              aria-label={t("Subcategories")}
              className="flex gap-2 overflow-x-auto px-4 pt-2 [scrollbar-width:none]"
            >
              <span
                aria-current="page"
                className={`${chip} bg-primary text-primary-foreground`}
              >
                {t("All")}
              </span>
              {children.map((child) => (
                <StackLink
                  key={child.slug}
                  href={href("category", { params: { slug: child.slug } })}
                  className={`${chip} bg-card`}
                >
                  {child.name[locale]}
                  <span className="text-muted-foreground">
                    {counts[child.slug]}
                  </span>
                </StackLink>
              ))}
            </nav>
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
