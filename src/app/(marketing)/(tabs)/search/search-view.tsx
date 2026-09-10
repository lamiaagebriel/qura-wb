"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  ListViewIcon,
  Loading03FreeIcons,
  Location01Icon,
  MapsIcon,
  Search01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { APIProvider, AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PlaceResultCard } from "@/components/place-result-card";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useSearchHistory } from "@/hooks/use-search-history";
import { mapGoogleTypesToQuraCategories } from "@/lib/business/google-category-mapping";
import { CATEGORY_META, isBusinessCategory } from "@/lib/categories";
import { searchUsersAction } from "@/lib/profile/actions/search-users";
import type {
  UnifiedSearchCursor,
  UnifiedSearchResult,
} from "@/lib/search/types";
import { useLocale } from "@/lib/i18n/client";
import { BUSINESS_CATEGORIES, type CityId } from "@/db/schema";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

// Same client-side env vars `location-picker.tsx` already reads for its
// own map — one Google Cloud project, one key, `NEXT_PUBLIC_` so it
// reaches the browser bundle.
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

// Real city centers, used only to frame the map when there's nothing to
// pin yet (no query, or a query with no geocoded results) — never a
// stand-in for an actual result. Limited to the two cities with real
// content (`AVAILABLE_CITIES`); anything else falls back to Aswan's
// center rather than guessing coordinates for a city with none on file.
const CITY_CENTER: Partial<Record<CityId, { lat: number; lng: number }>> = {
  aswan: { lat: 24.0889, lng: 32.8998 },
  luxor: { lat: 25.6872, lng: 32.6396 },
};
const DEFAULT_MAP_ZOOM = 13;

type MapPin = {
  id: string;
  position: { lat: number; lng: number };
  result: UnifiedSearchResult;
};

/** No UI of its own — fits the map's viewport to every current pin
 * whenever the pin set changes, so the map frames exactly (and only) the
 * search results it's showing. Does nothing at all with zero pins,
 * leaving the map at its default city-center view rather than fitting
 * an empty/degenerate bounds. */
function FitBoundsToPins({ pins }: { pins: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || pins.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const pin of pins) bounds.extend(pin.position);
    map.fitBounds(bounds, 64);
  }, [map, pins]);

  return null;
}

// Google's own documented deep-link format (the "Search" URL from
// Google Maps URLs — https://developers.google.com/maps/documentation/urls/get-started#search-action):
// passing `query_place_id` alongside a `query` pins the map on that
// EXACT place rather than re-running a text search that could resolve
// to a different result with a similar name nearby. `query` is required
// by the spec even though `query_place_id` is what actually disambiguates
// it — omitting it silently degrades to a generic text search on some
// clients. No API key needed. Kept local rather than shared since every
// other place this pattern is used (`google-place-info.tsx`,
// `account/business/google-place-connection.tsx`) also defines its own
// place-link helper rather than importing a shared one.
function googleMapsPlaceUrl(placeId: string, name: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: name,
    query_place_id: placeId,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

// Curated, human-sounding starting points — not a real "suggested queries"
// model, just enough to make the empty search state feel like a
// conversation starter rather than a blank box. Each one is a plain text
// query fed straight into the same search `searchUsersAction` already
// handles, no special-casing on the backend.
const SUGGESTED_QUERIES: Array<keyof import("@/lib/i18n/config").Dict> = [
  "Cozy cafe nearby",
  "Open restaurants right now",
  "Best places for breakfast",
  "Cheap places near me",
];

// First screenful of the category grid — the rest live behind "All
// categories" rather than dumping all 18 into the empty search state.
const FEATURED_CATEGORY_COUNT = 15;

type ViewMode = "list" | "map";

export function SearchView({ activeCity }: { activeCity: CityId }) {
  const { t } = useLocale();
  const {
    entries: history,
    record: recordVisit,
    clear: clearHistory,
  } = useSearchHistory();
  const [query, setQuery] = useState("");
  // The query the results on screen actually came from — not `query`
  // itself, which updates on every keystroke ahead of the debounce.
  // "Load more" has to keep paginating *this* search, not whatever the
  // user has typed since.
  const [committedQuery, setCommittedQuery] = useState("");
  const [isSearching, startSearching] = useTransition();
  const [view, setView] = useState<ViewMode>("list");
  // Which pin's preview card is open at the bottom of the map, if any —
  // cleared whenever the query changes (a new search invalidates whatever
  // was selected) or the map is tapped anywhere that isn't a pin.
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const { items, isLoading, hasMore, sentinelRef, reset } = useInfiniteList<
    UnifiedSearchResult,
    UnifiedSearchCursor
  >({
    initialItems: [],
    initialCursor: null,
    fetchMore: (cursor) => searchUsersAction(committedQuery, cursor),
  });

  useEffect(() => {
    const trimmed = query.trim();
    // Too short to search — leave the hook's `items` as whatever the last
    // real search left behind (harmless, since the render below never
    // shows them while `searchedEnough` is false) rather than resetting
    // state synchronously from here.
    if (trimmed.length < 2) return;

    const handle = setTimeout(() => {
      startSearching(async () => {
        const result = await searchUsersAction(trimmed, null);
        setCommittedQuery(trimmed);
        setSelectedPinId(null);
        reset(result.items, result.nextCursor);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, reset]);

  function runQuery(next: string) {
    setQuery(next);
  }

  const searchedEnough = query.trim().length >= 2;
  // Memoized so an unrelated re-render (e.g. `selectedPinId` changing
  // when a pin is tapped) doesn't hand `pins` below a fresh `[]`/array
  // identity every time — that was flowing into `FitBoundsToPins`'s
  // effect and re-fitting/panning the map on every click.
  const visibleItems = useMemo(
    () => (searchedEnough ? items : []),
    [searchedEnough, items],
  );
  // Google's Places API terms require attribution wherever place data it
  // provided is displayed outside a Google-branded map — shown once for
  // the whole list rather than per row, since every "google"/"both"
  // result on this page came from the same one Google response.
  const hasGoogleSourcedResult = visibleItems.some(
    (item) => item.source !== "qura",
  );
  // Only a result with a real Google-sourced coordinate gets a pin — a
  // Qura-only business with no connected Google place has nowhere to
  // point the map at, and nothing here ever invents one. Prefers this
  // page's own live Google response, falling back to the last cached
  // location for the same place (`cachedLocation`) when Google's search
  // didn't happen to include it this time — still a real, previously
  // fetched coordinate, not a guess.
  const pins: MapPin[] = useMemo(
    () =>
      visibleItems.flatMap((result) => {
        const location = result.googlePlace?.location ?? result.cachedLocation;
        if (!location || !result.googlePlaceId) return [];
        return [
          {
            id: result.id,
            position: { lat: location.latitude, lng: location.longitude },
            result,
          },
        ];
      }),
    [visibleItems],
  );
  const selectedPin = pins.find((pin) => pin.id === selectedPinId) ?? null;
  const mapCenter = CITY_CENTER[activeCity] ?? CITY_CENTER.aswan!;
  const resultCountLabel = isSearching
    ? t("Searching…")
    : `${visibleItems.length}${hasMore ? "+" : ""} ${t("results")}`;

  const searchInput = (
    <div className="relative flex-1">
      <HugeiconsIcon
        icon={Search01Icon}
        className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2"
      />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("Search by name or what you're looking for…")}
        className="bg-muted h-9.5 rounded-full ps-10"
      />
    </div>
  );

  // Icon-only, not a text label — same segmented-pill look as the empty
  // state's other controls, just compact enough to sit on the same line
  // as the search input instead of its own row below it.
  const viewToggle = (
    <div className="bg-muted flex shrink-0 gap-0.5 rounded-full p-0.5">
      <button
        type="button"
        aria-label={t("List")}
        aria-pressed={view === "list"}
        onClick={() => setView("list")}
        className={cn(
          "flex size-8.5 items-center justify-center rounded-full",
          view === "list"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground",
        )}
      >
        <HugeiconsIcon icon={ListViewIcon} className="size-4" />
      </button>
      <button
        type="button"
        aria-label={t("Map")}
        aria-pressed={view === "map"}
        onClick={() => setView("map")}
        className={cn(
          "flex size-8.5 items-center justify-center rounded-full",
          view === "map"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground",
        )}
      >
        <HugeiconsIcon icon={MapsIcon} className="size-4" />
      </button>
    </div>
  );

  // Once there's a real query, the whole results experience — search bar,
  // toggle, and both the list and the map — takes over the full viewport
  // (`fixed inset-0`, under `BottomNav`'s z-50 so the nav stays visible on
  // top, matching the mockup) rather than the list living in normal page
  // flow and the map being a boxed-in preview. List and map are BOTH kept
  // mounted the whole time `searchedEnough` is true, cross-fading via
  // opacity instead of one replacing the other in the DOM — switching is
  // instant and the map never has to re-initialize, which is what makes
  // it feel smooth rather than a reload. Changing the query text never
  // touches `view`, so whichever mode you were in stays selected as the
  // results underneath it change.
  if (searchedEnough) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col">
        <div className="bg-background flex items-center gap-2 p-4 pb-2">
          {searchInput}
          {viewToggle}
        </div>
        <div className="text-muted-foreground bg-background px-4 pb-2 text-[13px] font-medium">
          {resultCountLabel}
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-200",
              view === "map"
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0",
            )}
          >
            {GOOGLE_MAPS_API_KEY ? (
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  mapId={GOOGLE_MAPS_MAP_ID}
                  defaultCenter={mapCenter}
                  defaultZoom={DEFAULT_MAP_ZOOM}
                  disableDefaultUI
                  zoomControl
                  gestureHandling="greedy"
                  className="h-full w-full"
                  onClick={() => setSelectedPinId(null)}
                >
                  {pins.map((pin) => (
                    <AdvancedMarker
                      key={pin.id}
                      position={pin.position}
                      title={pin.result.name}
                      onClick={() => setSelectedPinId(pin.id)}
                    >
                      <Pin
                        background="var(--primary)"
                        borderColor="var(--primary)"
                        glyphColor="#fff"
                        scale={pin.id === selectedPinId ? 1.25 : 1}
                      />
                    </AdvancedMarker>
                  ))}
                  <FitBoundsToPins pins={pins} />
                </Map>
              </APIProvider>
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center px-8 text-center">
                <p className="text-muted-foreground text-[13px]">
                  {t("Map unavailable")}
                </p>
              </div>
            )}

            {/* The tapped pin's preview — floats at the bottom of the map,
                same idea as the mockup's bottom sheet. Reuses the exact
                same card as the list view (`SearchResultCard`) rather than
                a separate compact design, so a place reads identically
                whichever way you found it. */}
            {selectedPin && (
              <div className="absolute inset-x-4 bottom-24 z-20 max-h-[65%] overflow-y-auto">
                <div className="bg-background relative rounded-2xl shadow-lg">
                  <button
                    type="button"
                    aria-label={t("Close")}
                    onClick={() => setSelectedPinId(null)}
                    className="bg-background text-foreground absolute -top-3 -right-3 flex size-7 items-center justify-center rounded-full shadow-md"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  </button>
                  <SearchResultCard
                    result={selectedPin.result}
                    onNavigate={recordVisit}
                    activeCity={activeCity}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className={cn(
              "bg-background absolute inset-0 overflow-y-auto transition-opacity duration-200",
              view === "list"
                ? "z-10 opacity-100"
                : "pointer-events-none z-0 opacity-0",
            )}
          >
            {!isSearching && visibleItems.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-[13px]">
                {t("No businesses found.")}
              </p>
            )}

            <div className="container flex flex-col gap-3 px-4">
              {visibleItems.map((result) => (
                <SearchResultCard
                  key={result.id}
                  result={result}
                  onNavigate={recordVisit}
                  activeCity={activeCity}
                />
              ))}
            </div>

            {hasGoogleSourcedResult && (
              <p className="text-muted-foreground container px-4 pt-1 text-[11px]">
                {t("Places powered by Google")}
              </p>
            )}

            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-6">
                {isLoading && (
                  <HugeiconsIcon
                    icon={Loading03FreeIcons}
                    strokeWidth={2.5}
                    className="size-4"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="container px-4">{searchInput}</div>

      {!searchedEnough && (
        <>
          {history.length > 0 && (
            <>
              <div className="container flex items-center justify-between pt-2">
                <span className="text-muted-foreground text-[12.5px] font-medium">
                  {t("Recent searches")}
                </span>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-muted-foreground hover:text-foreground text-[12.5px] font-medium"
                >
                  {t("Clear")}
                </button>
              </div>
              <ul className="divide-border/60 flex flex-col divide-y">
                {history.map((user) => (
                  <li key={user.id} className="py-3">
                    <Link
                      href={`/profile/${user.username}`}
                      onClick={() => recordVisit(user)}
                      className="container flex items-center gap-3"
                    >
                      <Avatar>
                        {user.image && (
                          <AvatarImage src={user.image} alt={user.name} />
                        )}
                        <AvatarFallback>{user.name}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-1 flex-col leading-tight">
                        <span className="text-foreground text-[13.5px] font-medium">
                          {user.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          @{user.username}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="container pt-3">
            <p className="text-muted-foreground mb-2.5 text-[12px] font-bold tracking-wide uppercase">
              {t("Try asking")}
            </p>
          </div>
          <div className="scrollbar-none container flex gap-2 overflow-x-auto pb-1">
            {SUGGESTED_QUERIES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => runQuery(t(key))}
                className="border-border flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap"
              >
                <HugeiconsIcon
                  icon={SparklesIcon}
                  className="text-primary size-4 shrink-0"
                />
                {t(key)}
              </button>
            ))}
          </div>

          <div className="container flex items-center justify-between pt-4">
            <p className="text-muted-foreground text-[12px] font-bold tracking-wide uppercase">
              {t("Browse by category")}
            </p>
            <Link
              href="/categories"
              className="text-primary flex items-center gap-0.5 text-[12px] font-bold"
            >
              {t("All categories")}
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
            </Link>
          </div>
          <div className="container grid grid-cols-3 gap-2.5">
            {BUSINESS_CATEGORIES.slice(0, FEATURED_CATEGORY_COUNT).map(
              (category) => (
                <Link
                  key={category}
                  href={`/categories/${category}`}
                  className="bg-muted flex flex-col items-center gap-1.5 rounded-2xl px-1.5 py-3.5"
                >
                  <span className="bg-background flex size-9.5 items-center justify-center rounded-full shadow-xs">
                    <HugeiconsIcon
                      icon={CATEGORY_META[category].icon}
                      className="text-primary size-4.5"
                      strokeWidth={1.7}
                    />
                  </span>
                  <span className="text-center text-[11px] leading-tight font-semibold">
                    {t(CATEGORY_META[category].label)}
                  </span>
                </Link>
              ),
            )}
            {/* <Link
              href="/categories"
              className="bg-foreground flex flex-col items-center gap-1.5 rounded-2xl px-1.5 py-3.5"
            >
              <span className="bg-background/15 flex size-9.5 items-center justify-center rounded-full">
                <HugeiconsIcon
                  icon={MoreHorizontalCircle01Icon}
                  className="text-background size-4.5"
                  strokeWidth={1.7}
                />
              </span>
              <span className="text-background text-center text-[11px] leading-tight font-semibold">
                {t("Show all")}
              </span>
            </Link> */}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * One result card — the three `source` states render differently on
 * purpose, not just as a style tweak:
 *
 * - `"qura"`/`"both"`: a real Qura business. Links to its existing
 *   `/profile/[username]` page exactly as before Phase 4, and records a
 *   visit the same way. `"both"` additionally shows a small Google-source
 *   line so a connected business reads as "also on Google" without
 *   pretending Google's data replaced Qura's own.
 * - `"google"`: no Qura profile exists for this place — its own card, no
 *   `Link` to a profile (there's nowhere to navigate yet), just its
 *   Google-sourced name/address and an "Add to Qura" CTA.
 *
 * The avatar circle's icon always comes off `CATEGORY_META` — for a Qura
 * business, its own declared category; for a Google-only place, the best
 * guess `mapGoogleTypesToQuraCategories` can make from Google's own
 * `types`. A place matching no known category (rare — most real places
 * hit at least one entry) just gets a generic pin icon rather than
 * guessing further.
 */
function SearchResultCard({
  result,
  onNavigate,
  activeCity,
}: {
  result: UnifiedSearchResult;
  onNavigate: (entry: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  }) => void;
  activeCity: CityId;
}) {
  const { t } = useLocale();
  const isGoogleOnly =
    result.source === "google" || result.quraBusinesses.length === 0;
  const [primary, ...others] = result.quraBusinesses;

  const rawCategory = primary?.category;
  const category =
    rawCategory && isBusinessCategory(rawCategory)
      ? rawCategory
      : mapGoogleTypesToQuraCategories(result.googlePlace?.types ?? [])[0];
  const icon = category ? CATEGORY_META[category].icon : Location01Icon;
  const categoryLabel = category ? t(CATEGORY_META[category].label) : null;

  const directionsUrl = result.googlePlaceId
    ? googleMapsPlaceUrl(result.googlePlaceId, result.name)
    : null;

  return (
    <PlaceResultCard
      icon={icon}
      name={result.name}
      nameHref={
        !isGoogleOnly && primary ? `/profile/${primary.username}` : undefined
      }
      onNameClick={
        primary
          ? () =>
              onNavigate({
                id: primary.id,
                name: result.name,
                username: primary.username,
                image: primary.image,
              })
          : undefined
      }
      source={isGoogleOnly ? "google" : "qura"}
      metaLine={[categoryLabel, result.googlePlace?.address ?? primary?.city]
        .filter(Boolean)
        .join(" · ")}
      description={primary?.bio}
      directionsUrl={directionsUrl}
      viewHref={!isGoogleOnly && primary ? `/profile/${primary.username}` : undefined}
      onViewClick={
        primary
          ? () =>
              onNavigate({
                id: primary.id,
                name: result.name,
                username: primary.username,
                image: primary.image,
              })
          : undefined
      }
      googlePlace={result.googlePlace ?? undefined}
      activeCity={activeCity}
    >
      {others.length > 0 && (
        <ul className="mb-2.5 flex flex-col gap-1">
          {others.map((business) => (
            <li key={business.id}>
              <Link
                href={`/profile/${business.username}`}
                onClick={() =>
                  onNavigate({
                    id: business.id,
                    name: business.username,
                    username: business.username,
                    image: business.image,
                  })
                }
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                @{business.username}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PlaceResultCard>
  );
}
