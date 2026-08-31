"use client";

import { useState, useTransition } from "react";

import { ThreadCard, type ThreadCardData } from "@/components/thread-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ThreadCategory } from "@/db/schema";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useLocale } from "@/lib/i18n/client";
import { loadMoreFeedAction } from "@/lib/threads/actions/load-more";
import {
  THREAD_CATEGORY_META,
  THREAD_CATEGORY_ORDER,
} from "@/lib/threads/categories";
import type { FeedSort } from "@/lib/threads/queries";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03FreeIcons } from "@hugeicons/core-free-icons";

const SORTS: FeedSort[] = ["relevant", "latest"];
const SORT_LABEL = { relevant: "Relevant", latest: "Latest" } as const;

// `undefined` = every category mixed together (today's default) — not
// its own entry in `THREAD_CATEGORY_ORDER` since "all" isn't a real
// `ThreadCategory` a post can actually have.
type CategoryFilter = ThreadCategory | undefined;

/**
 * The home feed's "For you" section — a Top/Recent-style sort control
 * (same pattern as `ThreadReplies`) plus a row of category filter chips
 * ("Question", "Offer", "Alert", ...) above the list. Its own component
 * rather than the plain `ThreadList` profile tabs use, since switching
 * sort or category both have to reset to a fresh first page rather than
 * append.
 */
export function FeedThreadList({
  initialItems,
  initialCursor,
  currentUserId,
  emptyLabel,
}: {
  initialItems: ThreadCardData[];
  initialCursor: number | null;
  currentUserId?: string;
  emptyLabel: string;
}) {
  const { t } = useLocale();
  const [sort, setSort] = useState<FeedSort>("latest");
  const [category, setCategory] = useState<CategoryFilter>(undefined);
  const [isFiltering, startFiltering] = useTransition();
  const { items, isLoading, hasMore, sentinelRef, reset } = useInfiniteList<
    ThreadCardData,
    number
  >({
    initialItems,
    initialCursor,
    fetchMore: (cursor) => loadMoreFeedAction(cursor, sort, category),
  });

  function changeSort(next: FeedSort) {
    if (next === sort || isFiltering) return;
    setSort(next);
    startFiltering(async () => {
      const result = await loadMoreFeedAction(0, next, category);
      reset(result.items, result.nextCursor);
    });
  }

  function changeCategory(next: CategoryFilter) {
    if (next === category || isFiltering) return;
    setCategory(next);
    startFiltering(async () => {
      const result = await loadMoreFeedAction(0, sort, next);
      reset(result.items, result.nextCursor);
    });
  }

  return (
    <div className="grid grid-cols-1">
      <div className="container flex items-center justify-between py-2">
        <h2 className="text-[15px] font-semibold">{t("For you")}</h2>

        {/* {items.length > 0 && (
          <Select
            value={sort}
            onValueChange={(next: FeedSort) => changeSort(next)}
            disabled={isFiltering}
          >
            <SelectTrigger size="sm" aria-label={t("Sort feed")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {SORTS.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(SORT_LABEL[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} */}
      </div>

      <div className="scrollbar-none container flex gap-1.5 overflow-x-auto pb-2">
        <button
          type="button"
          disabled={isFiltering}
          onClick={() => changeCategory(undefined)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50",
            category === undefined
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground",
          )}
        >
          {t("All categories")}
        </button>
        {THREAD_CATEGORY_ORDER.map((option) => {
          const meta = THREAD_CATEGORY_META[option];
          return (
            <button
              key={option}
              type="button"
              disabled={isFiltering}
              onClick={() => changeCategory(option)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50",
                category === option
                  ? meta.color.chipActive
                  : meta.color.chipInactive,
              )}
            >
              <HugeiconsIcon icon={meta.icon} className="size-3.5" />
              {t(meta.label)}
            </button>
          );
        })}
      </div>

      <div className="container flex flex-col">
        {items.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-[13px]">
            {emptyLabel}
          </p>
        ) : (
          items.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              currentUserId={currentUserId}
            />
          ))
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
  );
}
