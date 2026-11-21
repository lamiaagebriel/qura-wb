import { CommentItem } from "@/components/comment-item";
import { HeaderFilter } from "@/components/header-filter";
import {
  ArrowUpDownIcon,
  FilterHorizontalIcon,
  HugeiconsIcon,
  StarIcon,
} from "@/components/icons";
import { Progress } from "@/components/ui/progress";
import { getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

import type { Review, ReviewSort, ReviewSummary } from "@/lib/reviews";
import { ReviewText } from "./review-text";
import { MyReviewActions, MyReviewRow } from "./write-review-button";

/** Five stars, filled up to `rating` (rounded to the nearest star). */
async function Stars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const { t, locale } = await getTranslations();
  const filled = Math.round(rating);
  const value = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(rating);
  return (
    <span
      role="img"
      aria-label={t("{{rating}} out of 5 stars", { rating: value })}
      className={cn("inline-flex shrink-0 gap-0.5", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <HugeiconsIcon
          key={star}
          icon={StarIcon}
          className={cn(
            "size-[1em]",
            star <= filled
              ? "fill-current text-amber-500"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

/**
 * In a card: the average, its stars and the count on the start side; a bar
 * per star (5 → 1) on the other.
 */
export async function ReviewSummaryCard({
  summary,
}: {
  summary: ReviewSummary;
}) {
  const { t, locale } = await getTranslations();
  const number = new Intl.NumberFormat(locale);
  const average = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(summary.average);

  return (
    <div className="flex items-center gap-5 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <span className="text-4xl leading-none font-bold tabular-nums">
          {average}
        </span>
        <Stars rating={summary.average} className="text-sm" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {t.plural(
            summary.count,
            { one: "{{count}} review", other: "{{count}} reviews" },
            { count: number.format(summary.count) },
          )}
        </span>
      </div>
      <ul className="flex min-w-0 flex-1 flex-col gap-1">
        {summary.byStars.map((count, i) => {
          const stars = 5 - i;
          return (
            <li
              key={stars}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="w-2 text-center tabular-nums">
                {number.format(stars)}
              </span>
              <Progress
                value={summary.count ? (count / summary.count) * 100 : 0}
                aria-label={t.plural(
                  stars,
                  {
                    one: "{{count}} star: {{reviews}}",
                    other: "{{count}} stars: {{reviews}}",
                  },
                  {
                    count: number.format(stars),
                    reviews: number.format(count),
                  },
                )}
                className="flex-1 **:data-[slot=progress-indicator]:bg-amber-500"
              />
              <span className="w-6 text-end tabular-nums">
                {number.format(count)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The reviews' filters as one icon in the header (`HeaderFilter`, like
 * the posts' type filter): a sheet with "All
 * ratings" and each star value someone gave, with counts (`?stars=`) —
 * then how they're ordered: newest, highest or lowest rated (`?sort=`).
 */
export async function ReviewFilter({
  summary,
  stars,
  sort,
}: {
  summary: ReviewSummary;
  /** The picked star filter (none: all). */
  stars: number | null;
  sort: ReviewSort;
}) {
  const { t, locale } = await getTranslations();
  const number = new Intl.NumberFormat(locale);
  const given = summary.byStars
    .map((count, i) => ({ stars: 5 - i, count }))
    .filter((option) => option.count > 0 || option.stars === stars);
  const starsLabel = (count: number) =>
    t.plural(
      count,
      { one: "{{count}} star", other: "{{count}} stars" },
      { count: number.format(count) },
    );

  return (
    <HeaderFilter
      title={t("Filter reviews")}
      groups={[
        // One star value only: nothing to filter (the group hides itself).
        {
          param: "stars",
          title: t("Filter by stars"),
          value: stars ? String(stars) : null,
          options: [
            {
              value: null,
              label: t("All ratings"),
              icon: FilterHorizontalIcon,
              iconColors: "bg-muted text-foreground",
            },
            ...given.map((option) => ({
              value: String(option.stars),
              label: `${starsLabel(option.stars)} · ${number.format(option.count)}`,
              short: starsLabel(option.stars),
              icon: StarIcon,
              iconColors: "bg-amber-500/15 text-amber-600",
            })),
          ],
        },
        {
          param: "sort",
          title: t("Sort reviews"),
          value: sort === "newest" ? null : sort,
          options:
            summary.count > 1
              ? [
                  { value: null, label: t("Newest first"), short: t("Newest") },
                  {
                    value: "highest",
                    label: t("Highest rated first"),
                    short: t("Highest"),
                  },
                  {
                    value: "lowest",
                    label: t("Lowest rated first"),
                    short: t("Lowest"),
                  },
                ].map((option) => ({
                  ...option,
                  icon: ArrowUpDownIcon,
                  iconColors: "bg-muted text-foreground",
                }))
              : [],
        },
      ]}
    />
  );
}

/** The list's heading: "5 reviews". */
export async function ReviewCount({ summary }: { summary: ReviewSummary }) {
  const { t, locale } = await getTranslations();
  return (
    <h2 className="text-lg font-bold">
      {t.plural(
        summary.count,
        { one: "{{count}} review", other: "{{count}} reviews" },
        { count: new Intl.NumberFormat(locale).format(summary.count) },
      )}
    </h2>
  );
}

/** No reviews at all (`stars`: none with that many stars). */
export async function ReviewsEmpty({ stars }: { stars?: number | null }) {
  const { t, locale } = await getTranslations();
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-card px-4 py-8 text-center ring-1 ring-foreground/5">
      <span className="flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <HugeiconsIcon icon={StarIcon} className="size-6" />
      </span>
      {stars ? (
        <p className="text-sm text-muted-foreground">
          {t("No {{count}}-star reviews yet.", {
            count: new Intl.NumberFormat(locale).format(stars),
          })}
        </p>
      ) : (
        <>
          <p className="font-semibold">{t("No reviews yet")}</p>
          <p className="text-sm text-muted-foreground">
            {t("Been here? Be the first to share how it was.")}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * One review, like a comment: photo, then name · age, the stars and the
 * text (long ones cut, with "more"), as a `CommentItem`. Yours is marked
 * "You" and gets ✏️ | 🗑 on its name line.
 */
async function ReviewItem({ review }: { review: Review }) {
  const { t, locale } = await getTranslations();
  return (
    <CommentItem
      name={review.author.name}
      image={review.author?.avatarUrl}
      you={review.mine ? t("You") : undefined}
      createdAt={review.createdAt}
      locale={locale}
      actions={review.mine && <MyReviewActions />}
    >
      <Stars rating={review.rating} className="text-xs" />
      {review.text && <ReviewText text={review.text} />}
    </CommentItem>
  );
}

/** The reviews as a comment thread: no card, no dividers. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="flex flex-col">
      {reviews.map((review) => (
        <li key={review.id}>
          {review.mine ? (
            <MyReviewRow>
              <ReviewItem review={review} />
            </MyReviewRow>
          ) : (
            <ReviewItem review={review} />
          )}
        </li>
      ))}
    </ul>
  );
}
