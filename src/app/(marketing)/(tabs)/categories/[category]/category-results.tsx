"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon } from "@hugeicons/core-free-icons";

import { AddToQuraSheet } from "@/components/add-to-qura-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { loadMoreCategoryDiscoveryAction } from "@/lib/search/actions/load-more-category";
import type {
  CategoryDiscoveryBusiness,
  CategoryDiscoveryCursor,
  CategoryDiscoveryResult,
} from "@/lib/search/category-discovery";
import { useLocale } from "@/lib/i18n/client";
import type { BusinessCategory, CityId } from "@/db/schema";

// The field each category's card previews under the business name —
// only `food-drinks`/`health` have a bespoke field to show; every other
// category previews the generic `details` blurb instead. Only used for
// `kind: "qura"` results (see `category-discovery.ts`'s `previewData`).
const PREVIEW_FIELD: Partial<Record<BusinessCategory, string>> = {
  "food-drinks": "cuisine",
  health: "specialty",
};

function quraPreview(business: CategoryDiscoveryBusiness, category: BusinessCategory): string {
  const field = PREVIEW_FIELD[category];
  const data = business.previewData;
  const preview = data ? (field ? data[field] : data.details) : undefined;
  return typeof preview === "string" && preview ? preview : `@${business.username}`;
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
      <ul className="divide-border/60 flex flex-col divide-y">
        {items.map((result) => (
          <CategoryResultRow
            key={resultKey(result)}
            result={result}
            category={category}
            activeCity={activeCity}
          />
        ))}
      </ul>

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
 * Three visibly different row shapes: `"qura"` looks exactly like the
 * pre-Phase-10 category row (no behavior change for the common case).
 * `"both"` links to every connected Qura profile and tags any business
 * that's here only via its Google connection (`via: "google_type"`) with
 * a small badge — never implying Qura reclassified it. `"google"` never
 * links anywhere (no Qura profile exists) and is visually distinct from
 * a real business row.
 */
function CategoryResultRow({
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
      <li className="container flex items-center gap-3 py-3">
        <Avatar>
          <AvatarFallback>
            <HugeiconsIcon icon={Location01Icon} className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col leading-tight">
          <span className="text-foreground text-[13.5px] font-medium">
            {result.place.name}
          </span>
          {result.place.address && (
            <span className="text-muted-foreground text-xs">
              {result.place.address}
            </span>
          )}
        </div>
        <AddToQuraSheet googlePlace={result.place} activeCity={activeCity} />
      </li>
    );
  }

  if (result.kind === "qura") {
    return (
      <li>
        <BusinessRow business={result.business} category={category} />
      </li>
    );
  }

  // kind === "both"
  return (
    <li className="flex flex-col">
      {result.businesses.map((business) => (
        <BusinessRow key={business.id} business={business} category={category} />
      ))}
    </li>
  );
}

function BusinessRow({
  business,
  category,
}: {
  business: CategoryDiscoveryBusiness;
  category: BusinessCategory;
}) {
  const { t } = useLocale();
  return (
    <Link
      href={`/profile/${business.username}`}
      className="container flex items-center gap-3 py-3"
    >
      <Avatar>
        {business.image && (
          <AvatarImage src={business.image} alt={business.name} />
        )}
        <AvatarFallback>{business.name}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-foreground text-[13.5px] font-medium">
          {business.name}
        </span>
        <span className="text-muted-foreground text-xs">
          {business.via === "category"
            ? quraPreview(business, category)
            : `@${business.username}`}
        </span>
      </div>
      {/* Never implies Qura reclassified this business — see
          `category-discovery.ts`'s `via` doc comment. */}
      {business.via === "google_type" && (
        <span className="text-muted-foreground shrink-0 text-[10px] font-medium">
          {t("Related via Google")}
        </span>
      )}
    </Link>
  );
}
