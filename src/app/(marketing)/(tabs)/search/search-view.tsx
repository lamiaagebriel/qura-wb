"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03FreeIcons,
  Location01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { AddToQuraSheet } from "@/components/add-to-qura-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useSearchHistory } from "@/hooks/use-search-history";
import { searchUsersAction } from "@/lib/profile/actions/search-users";
import type { UnifiedSearchCursor, UnifiedSearchResult } from "@/lib/search/types";
import { useLocale } from "@/lib/i18n/client";
import type { CityId } from "@/db/schema";

const DEBOUNCE_MS = 300;

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
        reset(result.items, result.nextCursor);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, reset]);

  const searchedEnough = query.trim().length >= 2;
  const visibleItems = searchedEnough ? items : [];
  // Google's Places API terms require attribution wherever place data it
  // provided is displayed outside a Google-branded map — shown once for
  // the whole list rather than per row, since every "google"/"both"
  // result on this page came from the same one Google response.
  const hasGoogleSourcedResult = visibleItems.some((item) => item.source !== "qura");

  return (
    <div className="flex flex-col gap-2">
      <div className="container px-4">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("Search businesses")}
            className="ps-8"
          />
        </div>
      </div>

      {!searchedEnough && history.length > 0 && (
        <>
          <div className="container flex items-center justify-end pt-4">
            <span className="text-muted-foreground sr-only text-[12.5px] font-medium">
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
          <ul className="flex flex-col">
            {history.map((user) => (
              <li key={user.id} className="border-border/60 border-b px-4 py-3">
                <Link
                  href={`/profile/${user.username}`}
                  onClick={() => recordVisit(user)}
                  className="flex items-center gap-3"
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

      {searchedEnough && !isSearching && visibleItems.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-[13px]">
          {t("No businesses found.")}
        </p>
      )}

      <ul className="flex flex-col">
        {visibleItems.map((result) => (
          <SearchResultRow
            key={result.id}
            result={result}
            onNavigate={recordVisit}
            activeCity={activeCity}
          />
        ))}
      </ul>

      {searchedEnough && hasGoogleSourcedResult && (
        <p className="text-muted-foreground container px-4 text-[11px]">
          {t("Places powered by Google")}
        </p>
      )}

      {searchedEnough && hasMore && (
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
  );
}

/**
 * One result row — the three `source` states render differently on
 * purpose, not just as a style tweak:
 *
 * - `"qura"`/`"both"`: a real Qura business. Links to its existing
 *   `/profile/[username]` page exactly as before Phase 4, and records a
 *   visit the same way. `"both"` additionally shows a small pin marker so
 *   a connected business reads as "also on Google" without pretending
 *   Google's data replaced Qura's own.
 * - `"google"`: no Qura profile exists for this place — not a `Link` at
 *   all (there's nowhere to navigate yet; claiming/viewing a Google-only
 *   place is a later phase), just its Google-sourced name and address.
 *   Never given a fake username or treated as followable/reviewable.
 */
function SearchResultRow({
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
  if (result.source === "google" || result.quraBusinesses.length === 0) {
    return (
      <li className="border-border/60 flex items-center gap-3 border-b px-4 py-3">
        <Avatar>
          <AvatarFallback>
            <HugeiconsIcon icon={Location01Icon} className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col leading-tight">
          <span className="text-foreground text-[13.5px] font-medium">
            {result.name}
          </span>
          {result.googlePlace?.address && (
            <span className="text-muted-foreground text-xs">
              {result.googlePlace.address}
            </span>
          )}
        </div>
        {result.source === "google" && result.googlePlace && (
          <AddToQuraSheet googlePlace={result.googlePlace} activeCity={activeCity} />
        )}
      </li>
    );
  }

  // Phase 5: several Qura businesses may share one Google place — the
  // first is the main row (matches the pre-Phase-5 single-business
  // layout), any others render as their own smaller linked lines right
  // underneath rather than being dropped.
  const [primary, ...others] = result.quraBusinesses;

  return (
    <li className="border-border/60 border-b px-4 py-3">
      <Link
        href={`/profile/${primary.username}`}
        onClick={() =>
          onNavigate({
            id: primary.id,
            name: result.name,
            username: primary.username,
            image: primary.image,
          })
        }
        className="flex items-center gap-3"
      >
        <Avatar>
          {primary.image && (
            <AvatarImage src={primary.image} alt={result.name} />
          )}
          <AvatarFallback>{result.name}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col leading-tight">
          <span className="text-foreground text-[13.5px] font-medium">
            {result.name}
          </span>
          <span className="text-muted-foreground text-xs">
            @{primary.username}
          </span>
        </div>
        {result.source === "both" && (
          <HugeiconsIcon
            icon={Location01Icon}
            className="text-muted-foreground size-4 shrink-0"
          />
        )}
      </Link>

      {others.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1.5 ps-11">
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
    </li>
  );
}
