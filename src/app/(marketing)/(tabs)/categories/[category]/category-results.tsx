"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORY_META } from "@/lib/categories";
import { PlaceResultCard } from "@/components/place-result-card";
import { loadMoreCategoryDiscoveryAction } from "@/lib/search/actions/load-more-category";
import type {
  CategoryDiscoveryBusiness,
  CategoryDiscoveryCursor,
  CategoryDiscoveryResult,
} from "@/lib/search/category-discovery";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import { useLocale } from "@/lib/i18n/client";
import type { BusinessCategory, CityId } from "@/db/schema";

// Google's own documented deep-link format (see search-view.tsx's copy of
// this same helper) — `query_place_id` pins the exact place rather than
// re-running a text search that could resolve to a similarly-named place
// nearby. Kept local rather than shared, same as every other place this
// pattern already lives in this codebase.
function googleMapsPlaceUrl(placeId: string, name: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: name,
    query_place_id: placeId,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

// The field each category's card previews under the business name —
// only `food-drinks`/`health` have a bespoke field to show; every other
// category previews the generic `details` blurb instead. Only used for
// `kind: "qura"` results (see `category-discovery.ts`'s `previewData`).
const PREVIEW_FIELD: Partial<Record<BusinessCategory, string>> = {
  "food-drinks": "cuisine",
  health: "specialty",
};

function quraPreview(
  business: CategoryDiscoveryBusiness,
  category: BusinessCategory,
): string | null {
  const field = PREVIEW_FIELD[category];
  const data = business.previewData;
  const preview = data ? (field ? data[field] : data.details) : undefined;
  return typeof preview === "string" && preview ? preview : null;
}

function resultKey(result: CategoryDiscoveryResult): string {
  if (result.kind === "qura") return `qura:${result.business.id}`;
  return `place:${result.place.placeId}`;
}

/**
 * Owns the list + "Load more" button — an explicit button, not infinite
 * scroll (Phase 12 decision), so a Google Text Search call only ever
 * happens on a deliberate click, never from scrolling quickly past a
 * sentinel.
 *
 * `items`/`cursor` are plain `useState`, seeded from the server-rendered
 * first page — "load more" only ever APPENDS to `items` and REPLACES
 * `cursor` with whatever the action returned, never refetches page 1.
 * `cursor` never touches the URL or any client-visible query string —
 * Google's opaque `pageToken` inside it is only ever round-tripped
 * through this component's state and the one server action call.
 *
 * Card visuals match `search-view.tsx`'s `SearchResultCard` — a
 * category-icon avatar, a Qura/Google source tag, a meta line, and a
 * matching action row — so a place reads the same whether it was found
 * by name in Search or by browsing a category here.
 */
export function CategoryResults({
  category,
  initialItems,
  initialCursor,
  activeCity,
}: {
  category: BusinessCategory;
  initialItems: CategoryDiscoveryResult[];
  initialCursor: CategoryDiscoveryCursor | null;
  activeCity: CityId;
}) {
  const { t } = useLocale();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  const handleLoadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMoreCategoryDiscoveryAction(category, cursor);
      // Append only — a failed/degraded Google side on this page simply
      // means fewer new items and a possibly-earlier `nextCursor: null`,
      // never a reason to touch what's already on screen (page 1 is
      // never refetched or replaced).
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
    });
  };

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-[13px]">
        {t("No businesses in this category yet.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="container flex flex-col gap-3 px-4">
        {items.map((result) => (
          <CategoryResultCard
            key={resultKey(result)}
            result={result}
            category={category}
            activeCity={activeCity}
          />
        ))}
      </div>

      {items.some((r) => r.kind !== "qura") && (
        <p className="text-muted-foreground container px-4 text-[11px]">
          {t("Places powered by Google")}
        </p>
      )}

      {cursor && (
        <div className="container flex justify-center px-4 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleLoadMore}
          >
            {t("Load more")}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Three visibly different card shapes: `"qura"` is a real business, one
 * card. `"both"` renders every connected Qura business grouped under the
 * one shared Google place's Directions link. `"google"` never links
 * anywhere (no Qura profile exists) and gets the "Add to Qura" CTA
 * instead of a "View" button.
 */
function CategoryResultCard({
  result,
  category,
  activeCity,
}: {
  result: CategoryDiscoveryResult;
  category: BusinessCategory;
  activeCity: CityId;
}) {
  if (result.kind === "google") {
    return (
      <GooglePlaceCard
        place={result.place}
        category={category}
        activeCity={activeCity}
      />
    );
  }

  if (result.kind === "qura") {
    return <BusinessCard business={result.business} category={category} />;
  }

  // kind === "both" — one card per connected business, each pointed at
  // the one Google place they all share.
  return (
    <div className="flex flex-col gap-3">
      {result.businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          category={category}
          place={result.place}
        />
      ))}
    </div>
  );
}

function GooglePlaceCard({
  place,
  category,
  activeCity,
}: {
  place: GooglePlaceSearchResult;
  category: BusinessCategory;
  activeCity: CityId;
}) {
  const { t } = useLocale();
  return (
    <PlaceResultCard
      icon={CATEGORY_META[category].icon}
      name={place.name}
      source="google"
      metaLine={[t(CATEGORY_META[category].label), place.address]
        .filter(Boolean)
        .join(" · ")}
      directionsUrl={googleMapsPlaceUrl(place.placeId, place.name)}
      googlePlace={place}
      activeCity={activeCity}
    />
  );
}

function BusinessCard({
  business,
  category,
  place,
}: {
  business: CategoryDiscoveryBusiness;
  category: BusinessCategory;
  // Only present for a `kind: "both"` group — the one Google place every
  // business in the group shares. A standalone `kind: "qura"` business
  // may still have its own `googlePlaceIds`, just not a fetched `place`
  // object with a name/location on this page.
  place?: GooglePlaceSearchResult;
}) {
  const { t } = useLocale();
  const description =
    business.via === "category" ? quraPreview(business, category) : null;
  const directionsUrl = place
    ? googleMapsPlaceUrl(place.placeId, business.name)
    : business.googlePlaceIds[0]
      ? googleMapsPlaceUrl(business.googlePlaceIds[0], business.name)
      : null;

  return (
    <PlaceResultCard
      icon={CATEGORY_META[category].icon}
      name={business.name}
      nameHref={`/profile/${business.username}`}
      source="qura"
      metaLine={
        business.via === "google_type"
          ? t("Related via Google")
          : `@${business.username}`
      }
      description={description}
      directionsUrl={directionsUrl}
      viewHref={`/profile/${business.username}`}
    />
  );
}
