import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { AdCarousel } from "@/components/home/ad-carousel";
import { CategoryCircles } from "@/components/home/category-circles";
import { CitySwitcher } from "@/components/home/city-switcher";
import { HugeiconsIcon, Search01Icon, Store01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import {
  HomeSection,
  OffersStrip,
  PostRow,
} from "@/components/posts/post-sections";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { getSession } from "@/lib/auth/session";
import { CATEGORIES } from "@/lib/categories";
import { getCurrentPlace, getPlaceIndex } from "@/server/queries/places";
import { categoryCounts } from "@/server/queries/businesses";
import { latestPosts } from "@/server/queries/posts";
import { getTranslations } from "@/lib/i18n/server";
import { placeName } from "@/lib/places";
import { href } from "@/lib/routes";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home, for the city the visitor picked (header pill): the sponsored
 * banner, "Explore places" (business categories), today's offers as
 * coupons, then the latest posts in a sideways row. The tab bar's centre +
 * writes a post.
 */
export default async function HomePage() {
  const [{ t, locale }, city, session] = await Promise.all([
    getTranslations(),
    getCurrentPlace(),
    getSession(),
  ]);
  const userId = session?.user.id;
  const [offers, feed, businessCounts] = await Promise.all([
    latestPosts(city, userId, { type: "offer", limit: 6 }),
    // Offers have their own strip above.
    latestPosts(city, userId, { except: "offer", limit: 5 }),
    categoryCounts(city),
  ]);
  const cityName = placeName((await getPlaceIndex()).get(city)!, locale);
  const categories = CATEGORIES.filter((c) => businessCounts[c.slug]);
  const feedLabel = t("Latest in {{city}}", { city: cityName });

  return (
    <Screen>
      <AppHeader title={t("Qura")} action={<CitySwitcher city={city} />} />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pt-1 pb-6">
          {/* A shortcut into Search (a tab: plain link), like a real field. */}
          <Link
            href={href("search")}
            className="mx-4 flex h-11 items-center gap-2 rounded-full border border-input bg-input/20 px-4 text-sm text-muted-foreground transition-[scale] active:scale-[0.98] motion-reduce:transition-none dark:bg-input/30"
          >
            <HugeiconsIcon icon={Search01Icon} className="size-5" />
            {t("Search places, cafés, restaurants…")}
          </Link>
          <AdCarousel />

          <HomeSection id="home-places" title={t("Explore places")}>
            {categories.length ? (
              <div className="flex flex-col gap-4">
                <CategoryCircles
                  label={t("Categories")}
                  categories={categories}
                />
              </div>
            ) : (
              <div className="px-4">
                <StatusScreen
                  icon={Store01Icon}
                  title={t("No businesses in {{city}} yet", { city: cityName })}
                  description={t("Check back soon, or pick another city.")}
                  inline
                />
              </div>
            )}
          </HomeSection>

          <OffersStrip offers={offers} />
          <HomeSection id="home-latest" title={feedLabel}>
            <PostRow posts={feed} label={feedLabel} more={href("posts")} />
          </HomeSection>
        </main>
      </PullToRefresh>
    </Screen>
  );
}
