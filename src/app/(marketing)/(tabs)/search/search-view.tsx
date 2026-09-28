"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  Gps01Icon,
  ListViewIcon,
  Loading03FreeIcons,
  Location01Icon,
  MapsIcon,
  Search01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PlaceResultCard } from "@/components/place-result-card";
import {
  BUSINESS_CATEGORIES,
  type BusinessCategory,
  type CityId,
} from "@/db/schema";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { MAX_ENTRIES, useSearchHistory } from "@/hooks/use-search-history";
import { mapGoogleTypesToQuraCategories } from "@/lib/business/google-category-mapping";
import { CATEGORY_META, isBusinessCategory } from "@/lib/categories";
import { CITY_CENTER } from "@/lib/city/cities";
import { useLocale } from "@/lib/i18n/client";
import { searchUsersAction } from "@/lib/profile/actions/search-users";
import type {
  UnifiedSearchCursor,
  UnifiedSearchResult,
} from "@/lib/search/types";
import type { MapArea } from "@/lib/search/unified-search";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 300;

// Same client-side env vars `location-picker.tsx` already reads for its
// own map — one Google Cloud project, one key, `NEXT_PUBLIC_` so it
// reaches the browser bundle.
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

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
 * an empty/degenerate bounds.
 *
 * Two refs coordinate this with `MapMoveTracker` below (both live at the
 * `SearchView` level, shared by both children — `useMap()` only works
 * inside the `<Map>` subtree, so neither can hold state the other reads
 * on its own):
 * - `skipNextFitRef`: set right before a "Search this area" re-search —
 *   the user explicitly chose this viewport, so the fresh results from
 *   it must NOT immediately yank the map back to fit them; consumed
 *   (reset to `false`) the one time it's checked, not left set.
 * - `suppressMoveRef`: set for the duration of a programmatic
 *   `fitBounds` call (cleared on the map's next `idle`), so
 *   `MapMoveTracker` doesn't mistake OUR pan/zoom for the user's and pop
 *   the "Search this area" button right after results load. */
function FitBoundsToPins({
  pins,
  skipNextFitRef,
  suppressMoveRef,
}: {
  pins: MapPin[];
  skipNextFitRef: React.RefObject<boolean>;
  suppressMoveRef: React.RefObject<boolean>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || pins.length === 0) return;
    if (skipNextFitRef.current) {
      skipNextFitRef.current = false;
      return;
    }
    suppressMoveRef.current = true;
    const bounds = new google.maps.LatLngBounds();
    for (const pin of pins) bounds.extend(pin.position);
    map.fitBounds(bounds, 64);
    google.maps.event.addListenerOnce(map, "idle", () => {
      suppressMoveRef.current = false;
    });
  }, [map, pins, skipNextFitRef, suppressMoveRef]);

  return null;
}

/** No UI of its own — watches for the user actually panning or zooming
 * the map (as opposed to `FitBoundsToPins` moving it programmatically,
 * suppressed via `suppressMoveRef`) and reports it via `onUserMoved`, so
 * `SearchView` can surface the Google-Maps-style "Search this area"
 * button. `dragstart` is an unambiguous user gesture; `zoom_changed`
 * also fires for `fitBounds`'s own zoom changes, which is exactly what
 * `suppressMoveRef` is there to filter out. */
function MapMoveTracker({
  mapRef,
  suppressMoveRef,
  onUserMoved,
}: {
  // Also just the way `SearchView` gets a handle on the live map
  // instance at all — reading `map.getCenter()`/`getZoom()` when
  // "Search this area" is tapped needs the real thing, not a re-derived
  // approximation.
  mapRef: React.RefObject<google.maps.Map | null>;
  suppressMoveRef: React.RefObject<boolean>;
  onUserMoved: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    mapRef.current = map;
    const handleUserMove = () => {
      if (!suppressMoveRef.current) onUserMoved();
    };
    const dragListener = map.addListener("dragstart", handleUserMove);
    const zoomListener = map.addListener("zoom_changed", handleUserMove);
    return () => {
      dragListener.remove();
      zoomListener.remove();
    };
  }, [map, mapRef, suppressMoveRef, onUserMoved]);

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

// A stable reference for `useInfiniteList`'s `initialItems` — this page
// has no server-fetched initial page (nothing to search until you type),
// unlike the feed/profile lists that hand it real server props. An
// inline `[]` in the hook call below would be a *new* array every
// render, and the hook syncs its state to `initialItems` by reference
// during render (by design, to pick up a fresh server refetch elsewhere)
// — with a literal that's true on every single render, which is an
// infinite render loop, not a one-time sync.
const EMPTY_RESULTS: UnifiedSearchResult[] = [];

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
  // The category a category chip's tap resolved to (or that the typed
  // text itself happened to match — see `matchCategory`), captured at
  // the same commit point as `committedQuery` for the same reason:
  // "load more" has to keep widening by *this* category, not whatever
  // the query box currently says.
  const [committedCategory, setCommittedCategory] = useState<
    BusinessCategory | undefined
  >(undefined);
  // Set once "Search this area" narrows results to the current map
  // viewport instead of the whole city — captured at commit time same as
  // `committedQuery`/`committedCategory`, so "load more" keeps paginating
  // *that* area rather than snapping back to city-wide. Cleared by a
  // fresh text/category search (typing or a category tap always means
  // "start over city-wide"), never by panning the map alone — the area
  // only actually changes on the next explicit "Search this area" tap.
  const [committedArea, setCommittedArea] = useState<MapArea | undefined>(
    undefined,
  );
  const [isSearching, startSearching] = useTransition();
  const [view, setView] = useState<ViewMode>("list");
  // Which pin's preview card is open at the bottom of the map, if any —
  // cleared whenever the query changes (a new search invalidates whatever
  // was selected) or the map is tapped anywhere that isn't a pin.
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  // Google-Maps-style "Search this area" — shown once the user actually
  // pans/zooms the map themselves (see `MapMoveTracker`), hidden again
  // the moment they tap it or start a fresh text/category search.
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const suppressMoveRef = useRef(false);
  const skipNextFitRef = useRef(false);
  // The device's own position, shown as a marker — only ever requested
  // when the user taps the map's "my location" button (see `locateMe`),
  // never on opening the map, so the browser's permission prompt shows up
  // as a direct answer to that tap rather than out of nowhere. One-shot,
  // not `watchPosition`'d: a live-tracking dot isn't needed here, just
  // "where roughly am I relative to these results."
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  function locateMe() {
    if (!navigator.geolocation) {
      toast.error(t("Couldn't get your location."));
      return;
    }
    setIsLocating(true);
    // Triggers the browser's own "allow location" prompt the first time
    // (or whenever permission is still undecided); an already-granted
    // permission just resolves straight away.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        const map = mapRef.current;
        if (map) {
          map.panTo(location);
          map.setZoom(Math.max(map.getZoom() ?? 0, 15));
        }
      },
      (error) => {
        setIsLocating(false);
        // A denial is remembered by the browser — calling again won't
        // re-prompt, so the only way forward is the site settings.
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? t(
                "Location access is blocked. Allow it in your browser settings.",
              )
            : t("Couldn't get your location."),
        );
      },
      { maximumAge: 60_000, timeout: 10_000 },
    );
  }

  const { items, isLoading, hasMore, sentinelRef, reset, loadMore } =
    useInfiniteList<UnifiedSearchResult, UnifiedSearchCursor>({
      initialItems: EMPTY_RESULTS,
      initialCursor: null,
      fetchMore: (cursor) =>
        searchUsersAction(
          committedQuery,
          cursor,
          committedCategory,
          committedArea,
        ),
    });

  // A category chip tap is just a shortcut for typing that category's own
  // name — same search, same results pipeline, not a separate mode or a
  // navigation to `/categories/[id]`. So the only thing this needs to
  // find is which (if any) category the current text names, by comparing
  // against every category's *translated* label — done here, not on the
  // server, since only the client reliably knows which locale the typed
  // text is actually in. An exact match (either direction, case-
  // insensitive) is required rather than a loose substring one — a query
  // like "hair" shouldn't silently start widening results to the whole
  // "Beauty" category just because "Hair Salons" contains it.
  function matchCategory(text: string): BusinessCategory | undefined {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return undefined;
    return BUSINESS_CATEGORIES.find(
      (category) =>
        t(CATEGORY_META[category].label).toLowerCase() === normalized,
    );
  }

  useEffect(() => {
    const trimmed = query.trim();
    // Too short to search — leave the hook's `items` as whatever the last
    // real search left behind (harmless, since the render below never
    // shows them while `searchedEnough` is false) rather than resetting
    // state synchronously from here.
    if (trimmed.length < 2) return;

    const category = matchCategory(trimmed);
    const handle = setTimeout(() => {
      startSearching(async () => {
        const result = await searchUsersAction(trimmed, null, category);
        setCommittedQuery(trimmed);
        setCommittedCategory(category);
        // A fresh text/category search always starts city-wide again —
        // any area narrowing from a previous "Search this area" no
        // longer applies to a different query.
        setCommittedArea(undefined);
        setSelectedPinId(null);
        setShowSearchThisArea(false);
        reset(result.items, result.nextCursor);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `matchCategory` closes over `t`, which is stable in practice for the life of one search session (switching language mid-search is a rare edge case, not worth re-debouncing every render to guard against).
  }, [query, reset]);

  function runQuery(next: string) {
    setQuery(next);
  }

  function clearSearch() {
    setQuery("");
  }

  // "Search this area" (Google-Maps-style): re-runs the exact same
  // query/category, but scopes Google's side to the map's current
  // viewport instead of the whole city (see `MapArea`) — what makes
  // panning/zooming into a neighborhood and re-searching actually surface
  // *that* neighborhood's places instead of the same city-wide set.
  // `skipNextFitRef` is set first so the results this produces don't
  // immediately trigger `FitBoundsToPins` to yank the map back to
  // whatever framed them — the user just told it exactly where to look.
  function handleSearchThisArea() {
    const map = mapRef.current;
    const center = map?.getCenter();
    const zoom = map?.getZoom();
    if (!center || zoom === undefined) return;

    const lat = center.lat();
    const lng = center.lng();
    // Meters-per-pixel at this latitude/zoom (the standard Web Mercator
    // formula) times a rough "half the visible map's shorter side" in
    // pixels — there's no reliable way to read the map `<div>`'s actual
    // rendered size from here, and this is a search-scoping radius, not
    // a pixel-perfect viewport match, so an assumed mobile-sized
    // viewport is close enough. Clamped so an extreme zoom level never
    // asks Google for an unreasonably tiny or huge radius.
    const metersPerPixel =
      (156_543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
    const radiusMeters = Math.min(Math.max(metersPerPixel * 300, 500), 50_000);
    const area: MapArea = { lat, lng, radiusMeters };

    setShowSearchThisArea(false);
    skipNextFitRef.current = true;
    startSearching(async () => {
      const result = await searchUsersAction(
        committedQuery,
        null,
        committedCategory,
        area,
      );
      setCommittedArea(area);
      setSelectedPinId(null);
      reset(result.items, result.nextCursor);
    });
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
  // Covers the debounce window too, not just the in-flight request —
  // `isSearching` alone only goes true once the transition actually
  // starts, so relying on it by itself would show the *previous*
  // search's "done" state (the back arrow) for the ~300ms between a
  // keystroke and the debounced request firing.
  const resultsPending = searchedEnough && committedQuery !== query.trim();
  const isLoadingResults = isSearching || resultsPending;
  const resultCountLabel = isLoadingResults
    ? t("Searching…")
    : `${visibleItems.length}${hasMore ? "+" : ""} ${t("results")}`;

  // The leading icon in the search box tracks exactly where the search
  // is at, Threads/Instagram-search-style: a magnifying glass at rest,
  // a spinner in its place the moment there's a query being resolved
  // (typed or debouncing), and once real results are on screen it
  // becomes a back arrow — tapping it both leaves the results view and
  // clears the query, the one action "go back" actually means here
  // (there's no separate results *page* to navigate back from, so
  // "back" and "clear" are the same thing).
  const searchInput = (
    <div className="relative flex-1">
      {isLoadingResults ? (
        <HugeiconsIcon
          icon={Loading03FreeIcons}
          strokeWidth={2.5}
          className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin"
        />
      ) : searchedEnough ? (
        <button
          type="button"
          aria-label={t("Back")}
          onClick={clearSearch}
          className="text-foreground absolute start-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-4 rtl:rotate-180"
          />
        </button>
      ) : (
        <HugeiconsIcon
          icon={Search01Icon}
          className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2"
        />
      )}
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

  // What the list layer shows before there's a real query — recent
  // searches, suggested queries and the category grid. Only the list
  // layer swaps to this; the map layer stays the map regardless.
  const emptyState = (
    <div className="pt-16 pb-24">
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
            {history.slice(0, MAX_ENTRIES).map((user) => (
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

      <div className="container pt-4">
        <p className="text-muted-foreground text-[12px] font-bold tracking-wide uppercase">
          {t("Browse by category")}
        </p>
      </div>
      <div className="container grid grid-cols-3 gap-2.5">
        {BUSINESS_CATEGORIES.map((category) => (
          // A shortcut for typing the category's own name, not a
          // navigation to a separate category page — see
          // `matchCategory`. Tapping it runs the exact same search a
          // business's name or bio mentioning this category already
          // goes through, just widened to also include everything
          // actually filed under it. There's no "All categories" page
          // anymore, so every category is listed here directly.
          <button
            key={category}
            type="button"
            onClick={() => runQuery(t(CATEGORY_META[category].label))}
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
          </button>
        ))}
      </div>
    </div>
  );

  // The whole search experience — search bar, toggle, and both the list
  // and the map — takes over the full viewport (`fixed inset-0`, under
  // `BottomNav`'s z-50 so the nav stays visible on top, matching the
  // mockup). List and map are BOTH kept mounted the whole time,
  // cross-fading via opacity instead of one replacing the other in the
  // DOM — switching is instant and the map never has to re-initialize.
  // The map is always the map, query or not (it just has no pins before
  // a search); only the list layer swaps between the empty state and
  // results. Changing the query text never touches `view`, so whichever
  // mode you were in stays selected as the results underneath it change.

  return (
    <div className="fixed inset-0 z-40 container px-0!">
      {/* Floating over the content instead of pushing it down — in map
            mode this is what makes the map itself go edge-to-edge under
            the controls rather than living in a boxed-in area below a
            solid header bar. Each control keeps its own pill
            background/shadow (no full-width bar behind them) so the map
            stays visible right up to their edges. List mode reuses the
            exact same floating header for consistency; the list's own
            content just gets top padding (`HEADER_CLEARANCE`) so cards
            start below it instead of being covered. */}
      <div className="absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-4 pb-0">
        <div className="flex items-center gap-2">
          {searchInput}
          {viewToggle}
        </div>
        {!!searchedEnough && (
          <span className="bg-background/90 text-muted-foreground w-fit rounded-full px-3 py-1 text-[13px] font-medium shadow-xs backdrop-blur-sm">
            {resultCountLabel}
          </span>
        )}
      </div>

      <div className="relative h-full overflow-hidden">
        {/* Map View */}
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
                {/* The classic Google-Maps "blue dot" — deliberately
                   not a `Pin` (those read as a *result*, a place you
                   could tap into; this is just "you are here," not
                   interactive). */}
                {userLocation && (
                  <AdvancedMarker
                    position={userLocation}
                    title={t("Your location")}
                  >
                    <div className="relative flex size-4 items-center justify-center">
                      <div className="absolute size-4 animate-ping rounded-full bg-[#4285F4]/30" />
                      <div className="relative size-3 rounded-full bg-[#4285F4] shadow-md ring-2 ring-white" />
                    </div>
                  </AdvancedMarker>
                )}
                <FitBoundsToPins
                  pins={pins}
                  skipNextFitRef={skipNextFitRef}
                  suppressMoveRef={suppressMoveRef}
                />
                <MapMoveTracker
                  mapRef={mapRef}
                  suppressMoveRef={suppressMoveRef}
                  onUserMoved={() => setShowSearchThisArea(true)}
                />
              </Map>
            </APIProvider>
          ) : (
            <div className="bg-muted flex h-full w-full items-center justify-center px-8 text-center">
              <p className="text-muted-foreground text-[13px]">
                {t("Map unavailable")}
              </p>
            </div>
          )}

          {/* "My location" — the only thing that ever asks for the
             device's location (see `locateMe`). Hidden without a map to
             center on. */}
          {GOOGLE_MAPS_API_KEY && (
            <button
              type="button"
              aria-label={t("Your location")}
              onClick={locateMe}
              disabled={isLocating}
              className="bg-background text-foreground absolute inset-e-4 top-28 z-20 flex size-10 items-center justify-center rounded-full shadow-lg disabled:opacity-60"
            >
              <HugeiconsIcon
                icon={isLocating ? Loading03FreeIcons : Gps01Icon}
                className={cn(
                  "size-5",
                  isLocating && "animate-spin",
                  userLocation && !isLocating && "text-[#4285F4]",
                )}
              />
            </button>
          )}

          {/* Google-Maps-style "Search this area" — appears once the
             user pans/zooms away from the auto-fitted view, floating
             below the header rather than replacing it. Only with a
             query to re-run; before one there's nothing to search. */}
          {showSearchThisArea && searchedEnough && (
            <div className="absolute inset-x-0 top-28 z-20 flex justify-center">
              <button
                type="button"
                onClick={handleSearchThisArea}
                disabled={isSearching}
                className="bg-background text-foreground flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg disabled:opacity-60"
              >
                <HugeiconsIcon
                  icon={isSearching ? Loading03FreeIcons : Search01Icon}
                  className={cn("size-4", isSearching && "animate-spin")}
                />
                {t("Search this area")}
              </button>
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

          {/* Pagination on the map is scroll-triggered on the LIST
             layer's sentinel — which never scrolls while it's the
             hidden layer behind the map, so `hasMore` pages would
             otherwise only ever load by switching to list and
             scrolling down there first. This is the map's own
             explicit trigger for the exact same `loadMore` (see
             `useInfiniteList`), so every matching pin is reachable
             without leaving map view. Hidden while a pin's preview is
             open — same bottom-anchored spot, only one at a time. */}
          {!selectedPin && searchedEnough && hasMore && (
            <div className="absolute inset-x-0 bottom-24 z-20 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoading}
                className="bg-background text-foreground flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold shadow-lg disabled:opacity-60"
              >
                {isLoading && (
                  <HugeiconsIcon
                    icon={Loading03FreeIcons}
                    strokeWidth={2.5}
                    className="size-4 animate-spin"
                  />
                )}
                {t("Load more")}
              </button>
            </div>
          )}
        </div>

        {/* List View */}
        <div
          className={cn(
            "bg-background absolute inset-0 overflow-y-auto transition-opacity duration-200",
            view === "list"
              ? "z-10 opacity-100"
              : "pointer-events-none z-0 opacity-0",
          )}
        >
          {!searchedEnough ? (
            emptyState
          ) : (
            <>
              {/* pt-24 clears the floating header (search row + toggle +
                 count pill) so the first card/empty-state message doesn't
                 start underneath it. */}
              {!isSearching && visibleItems.length === 0 && (
                <p className="text-muted-foreground pt-24 pb-8 text-center text-[13px]">
                  {t("No businesses found.")}
                </p>
              )}

              <div className="container flex flex-col gap-3 px-4 pt-24">
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
            </>
          )}
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="flex flex-col gap-2">
  //     <div className="container px-4">{searchInput}</div>

  //   </div>
  // );
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
      viewHref={
        !isGoogleOnly && primary ? `/profile/${primary.username}` : undefined
      }
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
