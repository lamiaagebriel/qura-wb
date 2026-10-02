import { HugeiconsIcon, StarIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { initials, timeAgo } from "@/lib/format";
import { getTranslations } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

import type { Review, ReviewSummary } from "@/lib/reviews";

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
          strokeWidth={1.5}
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

/** Average, stars and count on the start side; a bar per star on the other. */
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
    <div className="flex items-center gap-5">
      <div className="flex shrink-0 flex-col items-center gap-1">
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
      <ul className="flex min-w-0 flex-1 flex-col">
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One review: reviewer, stars and age, then the text. */
async function ReviewItem({ review }: { review: Review }) {
  const { locale } = await getTranslations();
  return (
    <article className="flex flex-col gap-2 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="size-9 shrink-0">
          {review.author.avatarUrl && (
            <AvatarImage src={review.author.avatarUrl} alt="" />
          )}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials(review.author.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <p dir="auto" className="truncate text-start text-sm font-semibold">
            {review.author.name}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Stars rating={review.rating} className="text-xs" />
            <span aria-hidden>·</span>
            <time dateTime={review.createdAt.toISOString()}>
              {timeAgo(review.createdAt, locale)}
            </time>
          </p>
        </div>
      </div>
      <p dir="auto" className="text-start text-sm leading-relaxed">
        {review.text}
      </p>
    </article>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="divide-y divide-border/60 rounded-2xl bg-card px-4 ring-1 ring-foreground/5">
      {reviews.map((review) => (
        <li key={review.id}>
          <ReviewItem review={review} />
        </li>
      ))}
    </ul>
  );
}
