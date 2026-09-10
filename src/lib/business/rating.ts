/**
 * One combined rating indicator for a business — Qura's own reviews and
 * Google's public rating blended into a single weighted average and a
 * single total count, rather than two separate numbers shown in
 * different places (the profile header used to show only Qura's
 * average; `BusinessBlockCard`'s Overview tab showed Google's rating
 * again as its own row; the Reviews tab showed a third, Qura-only
 * summary). There is exactly one indicator now, and every place that
 * shows a rating computes it the same way, from the same two inputs.
 *
 * A weighted average (not a plain average of the two averages) so a
 * business with 3 Qura reviews and 214 Google reviews doesn't let 3
 * data points count as much as 214 — `average` is what you'd get by
 * treating every underlying rating (Qura's and Google's) as one pool.
 *
 * Never fetches or writes anything itself — pure arithmetic over
 * whatever the caller already has (`getBusinessRatingSummary`'s result,
 * and a connected Google place's `rating`/`userRatingCount`, if any).
 */
export type RatingSummary = {
  average: number | null;
  count: number;
  // How much of `count` came from Google, purely so callers can credit
  // it ("(includes N Google reviews)") — Google's individual review text
  // is never fetched or shown, only this aggregate.
  googleCount: number;
};

export function mergeRatingSummary(
  qura: { average: number | null; count: number },
  google?: { rating?: number; userRatingCount?: number } | null,
): RatingSummary {
  const googleCount = google?.userRatingCount ?? 0;
  const googleRating = google?.rating;

  if (googleCount <= 0 || googleRating === undefined) {
    return { average: qura.average, count: qura.count, googleCount: 0 };
  }

  if (qura.count <= 0 || qura.average === null) {
    return { average: googleRating, count: googleCount, googleCount };
  }

  const totalCount = qura.count + googleCount;
  const average =
    (qura.average * qura.count + googleRating * googleCount) / totalCount;
  return { average, count: totalCount, googleCount };
}
