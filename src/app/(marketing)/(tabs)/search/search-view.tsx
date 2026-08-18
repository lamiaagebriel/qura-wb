"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  Loading03FreeIcons,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useSearchHistory } from "@/hooks/use-search-history";
import { searchUsersAction } from "@/lib/profile/actions/search-users";
import { useLocale } from "@/lib/i18n/client";

type SearchUser = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
};

const DEBOUNCE_MS = 300;

export function SearchView() {
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
    SearchUser,
    number
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
        const result = await searchUsersAction(trimmed, 0);
        setCommittedQuery(trimmed);
        reset(result.items, result.nextCursor);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, reset]);

  const searchedEnough = query.trim().length >= 2;
  const visibleItems = searchedEnough ? items : [];

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
        {visibleItems.map((user) => (
          <li key={user.id} className="border-border/60 border-b px-4 py-3">
            <Link
              href={`/profile/${user.username}`}
              onClick={() =>
                recordVisit({
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  image: user.image,
                })
              }
              className="flex items-center gap-3"
            >
              <Avatar>
                {user.image && <AvatarImage src={user.image} alt={user.name} />}
                <AvatarFallback>{user.name}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col leading-tight">
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
