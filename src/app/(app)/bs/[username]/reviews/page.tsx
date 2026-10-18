import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { CheckmarkBadge01Icon, HugeiconsIcon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import {
  ReviewFilter,
  ReviewList,
  ReviewsEmpty,
  ReviewSummaryCard,
} from "@/components/profile/reviews";
import { ReviewComposer } from "@/components/profile/write-review-button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Business } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { categoryOf } from "@/lib/categories";
import { findPublicBusiness, isMine } from "@/lib/data/businesses";
import { getMyReview, getReviews, getReviewSummary } from "@/lib/data/reviews";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { isReviewSort } from "@/lib/reviews";
import { href } from "@/lib/routes";

export async function generateMetadata({
  params,
}: PageProps<"/bs/[username]/reviews">): Promise<Metadata> {
  const [{ t, locale }, { username }] = await Promise.all([
    getTranslations(),
    params,
  ]);
  const business = await findPublicBusiness(decodeURIComponent(username));
  if (!business) return {};
  return {
    title: t("Reviews of {{name}}", { name: inLocale(business.name, locale) }),
    alternates: {
      canonical: href("businessReviews", { params: { username } }),
    },
  };
}

/**
 * All of a business's reviews, like a comment thread: which business, the
 * rating summary, the list's heading with a star filter (`?stars=`) and
 * its order (`?sort=`), then the reviews (yours first). Anyone signed in can write one from the bar at the bottom,
 * except on their own business.
 */
export default async function BusinessReviewsPage({
  params,
  searchParams,
}: PageProps<"/bs/[username]/reviews">) {
  const [{ t, locale }, { username }, { stars: starsParam, sort: sortParam }, session] =
    await Promise.all([
      getTranslations(),
      params,
      searchParams,
      getSession(),
    ]);
  // `?stars=1…5`: only reviews with that many stars.
  const stars = [1, 2, 3, 4, 5].includes(Number(starsParam))
    ? Number(starsParam)
    : null;
  // `?sort=highest|lowest`; newest first by default.
  const sort = isReviewSort(sortParam) ? sortParam : "newest";
  const business = await findPublicBusiness(decodeURIComponent(username));
  if (!business) notFound();
  const userId = session?.user.id;
  const [reviews, summary, myReview] = await Promise.all([
    getReviews(business.id, userId, stars ?? undefined, sort),
    getReviewSummary(business.id),
    userId ? getMyReview(business.id, userId) : undefined,
  ]);
  // Hidden by an admin, it isn't listed: the bar edits it instead.
  const hasVisibleReview = myReview?.status === "visible";
  const mine = myReview && { rating: myReview.rating, text: myReview.text };

  const list =
    reviews.length > 0 ? (
      <ReviewList reviews={reviews} />
    ) : (
      summary.count > 0 && <ReviewsEmpty stars={stars} />
    );

  return (
    <Screen>
      <AppHeader
        title={t("Reviews")}
        back={href("business", { params: { username: business.username } })}
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-2 pb-8">
          <BusinessBrief business={business} />

          {summary.count > 0 ? (
            <>
              <ReviewSummaryCard summary={summary} />
              <ReviewFilter summary={summary} stars={stars} sort={sort} />
            </>
          ) : (
            <ReviewsEmpty />
          )}

          {isMine(business, userId) ? (
            list
          ) : (
            <ReviewComposer
              username={business.username}
              businessName={inLocale(business.name, locale)}
              me={
                session
                  ? {
                      name: session.user.name,
                      avatarUrl: session.user.image ?? null,
                    }
                  : undefined
              }
              mine={mine}
              hasVisibleReview={hasVisibleReview}
            >
              {list}
            </ReviewComposer>
          )}
        </main>
      </PullToRefresh>
    </Screen>
  );
}

/**
 * Which business the reviews are about, in one row: logo, then name and
 * category · handle.
 */
async function BusinessBrief({ business }: { business: Business }) {
  const { t, locale } = await getTranslations();
  const category = categoryOf(business.category);
  // Written by the owner; shown in the app language (English if missing).
  const name = inLocale(business.name, locale);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-12 shrink-0 ring-1 ring-foreground/10">
        {business.image && <AvatarImage src={business.image} alt="" />}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {category ? (
            <HugeiconsIcon
              icon={category.icon}
              strokeWidth={1.75}
              className="size-6"
            />
          ) : (
            name
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 className="flex min-w-0 items-center gap-1 text-base leading-tight font-bold">
          <span dir="auto" className="truncate">
            {name}
          </span>
          {business.verified && (
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              role="img"
              aria-label={t("Verified")}
              className="size-4 shrink-0 text-primary"
            />
          )}
        </h2>
        <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {category && (
            <>
              <span className="shrink-0">{category.name[locale]}</span>
              <span aria-hidden>·</span>
            </>
          )}
          <bdi dir="ltr" className="truncate">
            @{business.username}
          </bdi>
        </p>
      </div>
    </div>
  );
}
