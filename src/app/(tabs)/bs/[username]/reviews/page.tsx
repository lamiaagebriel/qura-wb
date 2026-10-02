import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { CheckmarkBadge01Icon, HugeiconsIcon } from "@/components/icons";
import { Screen } from "@/components/navigation/screen";
import { ReviewList, ReviewSummaryCard } from "@/components/profile/reviews";
import { WriteReviewButton } from "@/components/profile/write-review-button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Business } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { categoryOf } from "@/lib/categories";
import { findPublicBusiness, isMine } from "@/lib/data/businesses";
import { getMyReview, getReviews, getReviewSummary } from "@/lib/data/reviews";
import { initials } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
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
 * All of a business's reviews, newest first, under a brief of the
 * business and the rating summary. Anyone signed in can write one, except
 * on their own business.
 */
export default async function BusinessReviewsPage({
  params,
}: PageProps<"/bs/[username]/reviews">) {
  const [{ t, locale }, { username }, session] = await Promise.all([
    getTranslations(),
    params,
    getSession(),
  ]);
  const business = await findPublicBusiness(decodeURIComponent(username));
  if (!business) notFound();
  const userId = session?.user.id;
  const [reviews, summary, mine] = await Promise.all([
    getReviews(business.id),
    getReviewSummary(business.id),
    userId ? getMyReview(business.id, userId) : undefined,
  ]);

  return (
    <Screen>
      <AppHeader
        title={t("Reviews")}
        back={href("business", { params: { username: business.username } })}
      />
      <PullToRefresh>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-4 pt-2 pb-8">
          <div className="flex flex-col gap-10 text-center">
            <BusinessBrief business={business} />

            {reviews.length > 0 ? (
              <ReviewSummaryCard summary={summary} />
            ) : (
              <p className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/5">
                {t("No reviews yet. Be the first!")}
              </p>
            )}
          </div>

          {!isMine(business, userId) && (
            <WriteReviewButton
              businessName={inLocale(business.name, locale)}
              username={business.username}
              signedIn={!!userId}
              mine={mine}
            />
          )}
          {reviews.length > 0 && <ReviewList reviews={reviews} />}
        </main>
      </PullToRefresh>
    </Screen>
  );
}

/**
 * Which business a sub-screen (e.g. its reviews) is about: logo, name,
 * category · handle, centred in a small card.
 */
async function BusinessBrief({ business }: { business: Business }) {
  const { t, locale } = await getTranslations();
  const category = categoryOf(business.category);
  // Written by the owner; shown in the app language (English if missing).
  const name = inLocale(business.name, locale);

  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <Avatar className="size-16 shrink-0 ring-1 ring-foreground/10">
        {business.image && <AvatarImage src={business.image} alt="" />}
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {category ? (
            <HugeiconsIcon
              icon={category.icon}
              strokeWidth={1.75}
              className="size-8"
            />
          ) : (
            initials(name)
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
        <h2 className="flex max-w-full min-w-0 items-center justify-center gap-1 text-lg leading-tight font-bold">
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
        <p className="flex max-w-full min-w-0 items-center justify-center gap-1 text-sm text-muted-foreground">
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
