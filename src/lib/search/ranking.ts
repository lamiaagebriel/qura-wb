import type { CategoryDiscoveryBusiness, CategoryDiscoveryResult } from "./category-discovery";

/**
 * The three Qura engagement signals that actually exist today without
 * new schema (Phase 13's audit) — review count, average rating, and
 * follower count. Thread/post count and "profile completeness" were
 * deliberately left out: thread count is currently `0` for every
 * business in real data (nothing to rank by yet), and completeness is a
 * heuristic, not a real engagement signal. A missing entry in the
 * `Map` this type keys means "no data" (0 reviews, 0 followers, no
 * rating), not "signal unavailable" — see `EMPTY_SIGNALS` below.
 */
export type QuraEngagementSignals = {
  reviewCount: number;
  averageRating: number | null;
  followerCount: number;
};

const EMPTY_SIGNALS: QuraEngagementSignals = {
  reviewCount: 0,
  averageRating: null,
  followerCount: 0,
};

/**
 * Fixed priority list, not a weighted score, per the Phase 13 design
 * discussion: `reviewCount` first (the most legible, hardest-to-game
 * Qura action), then `followerCount`, then `averageRating` (a business
 * with no reviews sorts after one with reviews, regardless of what a
 * `null` average would otherwise compare as), then `id` as the final
 * tie-breaker — this is what guarantees "identical inputs → identical
 * ordering" holds even when every real signal is tied (e.g. two
 * businesses with zero reviews and zero followers).
 *
 * Generic over any `{id: string}` — Phase 17/18 reuses this exact
 * comparator for unified search's `merge.ts` (a different result shape
 * than category discovery's `CategoryDiscoveryBusiness`), rather than
 * duplicating the priority list a second time. Category discovery's own
 * `rankQuraResults`/`rankGoogleAnchoredResults` below are unchanged and
 * still call this the same way they always did.
 */
export function compareByEngagement<T extends { id: string }>(
  a: T,
  b: T,
  signals: Map<string, QuraEngagementSignals>,
): number {
  const sa = signals.get(a.id) ?? EMPTY_SIGNALS;
  const sb = signals.get(b.id) ?? EMPTY_SIGNALS;

  if (sa.reviewCount !== sb.reviewCount) return sb.reviewCount - sa.reviewCount;
  if (sa.followerCount !== sb.followerCount) return sb.followerCount - sa.followerCount;

  const ratingA = sa.averageRating ?? -Infinity;
  const ratingB = sb.averageRating ?? -Infinity;
  if (ratingA !== ratingB) return ratingB - ratingA;

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function compareBusinesses(
  a: CategoryDiscoveryBusiness,
  b: CategoryDiscoveryBusiness,
  signals: Map<string, QuraEngagementSignals>,
): number {
  return compareByEngagement(a, b, signals);
}

/**
 * Reorders a same-tier list of `kind: "qura"` results by Qura engagement
 * — for tiers 1 and 2 only (`category-discovery.ts` calls this on each
 * tier's own array before concatenating, never across tiers: the tier
 * itself is always the primary sort key, this only breaks ties within
 * one). Pure — no DB access, no Google awareness, nothing here can widen
 * or narrow which results appear, only their order.
 *
 * `results` not already `kind: "qura"` are left in place untouched
 * (defensive — `category-discovery.ts` never actually mixes kinds within
 * a tier array, but this function doesn't assume that of its caller).
 */
export function rankQuraResults(
  results: CategoryDiscoveryResult[],
  signals: Map<string, QuraEngagementSignals>,
): CategoryDiscoveryResult[] {
  return [...results].sort((a, b) => {
    if (a.kind !== "qura" || b.kind !== "qura") return 0;
    return compareBusinesses(a.business, b.business, signals);
  });
}

/**
 * Reorders the `businesses[]` INSIDE each `"both"` result by the same
 * Qura-engagement comparator — for tier 3 only. Does NOT reorder the
 * `"both"` results relative to each other or to `"google"` results:
 * that ordering stays Google's own Text Search relevance order,
 * untouched, per the Phase 13 design decision not to let a Google
 * signal reorder Google-anchored results this phase.
 */
export function rankGoogleAnchoredResults(
  results: CategoryDiscoveryResult[],
  signals: Map<string, QuraEngagementSignals>,
): CategoryDiscoveryResult[] {
  return results.map((result) =>
    result.kind === "both"
      ? {
          ...result,
          businesses: [...result.businesses].sort((a, b) =>
            compareBusinesses(a, b, signals),
          ),
        }
      : result,
  );
}
