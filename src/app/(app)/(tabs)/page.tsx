import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { AdCarousel } from "@/components/home/ad-carousel";
import { CategoryCircles } from "@/components/home/category-circles";
import { CitySwitcher } from "@/components/home/city-switcher";
import { Store01Icon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { NewPostFab } from "@/components/posts/new-post-fab";
import {
  HomeSection,
  OffersStrip,
  PostRow,
} from "@/components/posts/post-sections";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { getSession } from "@/lib/auth/session";
import { CATEGORIES } from "@/lib/categories";
import { getCurrentPlace, getPlaceIndex } from "@/lib/data/places";
import { categoryCounts } from "@/lib/data/businesses";
import { latestPosts } from "@/lib/data/posts";
import { getTranslations } from "@/lib/i18n/server";
import { placeName } from "@/lib/places";
import { href } from "@/lib/routes";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home, for the city the visitor picked (header pill): the sponsored
 * banner, "Explore places" (business categories), today's offers as
 * coupons, then the latest posts in a sideways row. The floating + writes
 * a post.
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
    latestPosts(city, userId, { except: "offer", limit: 16 }),
    categoryCounts(city),
  ]);
  const cityName = placeName((await getPlaceIndex()).get(city)!, locale);
  const categories = CATEGORIES.filter((c) => businessCounts[c.slug]);
  const feedLabel = t("Latest in {{city}}", { city: cityName });

  return (
    <Screen>
      <AppHeader
        title={t("Qura")}
        large
        action={<CitySwitcher city={city} />}
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pt-1 pb-28">
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
          <HomeSection id="home-latest" title={feedLabel} more={href("posts")}>
            <PostRow posts={feed} label={feedLabel} />
          </HomeSection>
        </main>
      </PullToRefresh>
      <NewPostFab signedIn={!!userId} />
    </Screen>
  );
}
