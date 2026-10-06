import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { AdCarousel } from "@/components/home/ad-carousel";
import { CategoryChips } from "@/components/category-chips";
import { BusinessCard } from "@/components/home/business-card";
import { CitySwitcher } from "@/components/home/city-switcher";
import { HugeiconsIcon, StarIcon, Store01Icon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Screen } from "@/components/navigation/screen";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { StatusScreen } from "@/components/status-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CATEGORIES } from "@/lib/categories";
import { cityOf } from "@/lib/cities";
import { getCity } from "@/lib/city-server";
import {
  categoryCounts,
  newestIn,
  topRatedIn,
  type RatedBusiness,
} from "@/lib/data/businesses";
import { recentReviewsIn } from "@/lib/data/reviews";
import { timeAgo } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import type { CityReview } from "@/lib/reviews";
import { href } from "@/lib/routes";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home: discovery for the city the visitor picked (header pill) — its
 * categories, top-rated and newest businesses, and the latest reviews.
 */
export default async function HomePage() {
  const [{ t, locale }, city] = await Promise.all([
    getTranslations(),
    getCity(),
  ]);
  const [counts, topRated, newest, latestReviews] = await Promise.all([
    categoryCounts(city),
    topRatedIn(city),
    newestIn(city),
    recentReviewsIn(city),
  ]);
  const cityName = cityOf(city)!.name[locale];
  const categories = CATEGORIES.filter((c) => counts[c.slug]);

  return (
    <Screen>
      <AppHeader
        title={t("Qura")}
        large
        action={<CitySwitcher city={city} />}
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pt-4 pb-8">
          {newest.length === 0 ? (
            <div className="px-4">
              <StatusScreen
                icon={Store01Icon}
                title={t("No businesses in {{city}} yet", { city: cityName })}
                description={t("Check back soon, or pick another city.")}
                inline
              />
            </div>
          ) : (
            <>
              <AdCarousel />
              <CategoryChips
                label={t("Categories")}
                chips={categories.map((c) => ({
                  slug: c.slug,
                  name: c.name[locale],
                  icon: c.icon,
                  // Its whole subtree, in the city and its sub-cities.
                  count: counts[c.slug],
                }))}
              />
              {topRated.length > 0 && (
                <Section title={t("Top rated")}>
                  <Scroller businesses={topRated} />
                </Section>
              )}
              <Section title={t("New in {{city}}", { city: cityName })}>
                <Scroller businesses={newest} />
              </Section>
              {latestReviews.length > 0 && (
                <Section title={t("Latest reviews")}>
                  <ul className="mx-4 divide-y divide-border/60 rounded-2xl bg-card ring-1 ring-foreground/5">
                    {latestReviews.map((review) => (
                      <li key={review.id}>
                        <ReviewRow review={review} />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** A horizontal row of business cards, snapping card by card. */
function Scroller({ businesses }: { businesses: RatedBusiness[] }) {
  return (
    <div className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
      {businesses.map((business) => (
        <BusinessCard key={business.username} business={business} />
      ))}
    </div>
  );
}

/** A review: who wrote it, about which business, stars, then its text. */
async function ReviewRow({ review }: { review: CityReview }) {
  const { t, locale } = await getTranslations();
  return (
    <StackLink
      href={href("businessReviews", {
        params: { username: review.business.username },
      })}
      className="flex gap-3 px-4 py-3 text-start"
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={review.author?.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{review.author.name}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm">
          <span className="font-semibold">{review.author.name}</span>
          <span className="text-muted-foreground"> · </span>
          <bdi dir="auto" className="font-medium">
            {inLocale(review.business.name, locale)}
          </bdi>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            role="img"
            aria-label={t("{{rating}} out of 5 stars", {
              rating: review.rating,
            })}
            className="inline-flex gap-0.5"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <HugeiconsIcon
                key={star}
                icon={StarIcon}
                strokeWidth={1.5}
                className={
                  star <= review.rating
                    ? "size-3 fill-current text-amber-500"
                    : "size-3 text-muted-foreground/40"
                }
              />
            ))}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={review.createdAt.toISOString()}>
            {timeAgo(review.createdAt, locale)}
          </time>
        </span>
        <span dir="auto" className="line-clamp-2 text-sm leading-relaxed">
          {review.text}
        </span>
      </span>
    </StackLink>
  );
}
