"use client";

import { useState, useTransition } from "react";

import { ThreadCard, type ThreadCardData } from "@/components/thread-card";
import { clearDraft } from "@/lib/threads/draft-store";
import { deletePendingImage } from "@/lib/threads/pending-image-store";
import {
  optimisticPostToThreadCardData,
  removeOptimisticPost,
  useOptimisticPosts,
} from "@/lib/threads/optimistic-posts";
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
  // A thread just posted from this browser, still uploading its images
  // in the background — see `new-thread-composer.tsx` and
  // `optimistic-posts.ts`. Filtered to top-level posts only — the same
  // store also holds in-flight replies, which `ThreadReplies` reads
  // instead. Only shown while browsing "All categories": it's confusing
  // to see your own post appear inside a category filter it may not even
  // match (nothing here re-checks it against `category`, since it isn't
  // a real thread yet to check).
  const optimisticPosts = useOptimisticPosts().filter((post) => !post.parentId);
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
        <h2 className="text-[15px] font-semibold">{t("What's around you…")}</h2>

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
              <HugeiconsIcon icon={meta.icon} className="size-3" />
              {t(meta.label)}
            </button>
          );
        })}
      </div>

      <div className="container flex flex-col px-0!">
        {category === undefined &&
          optimisticPosts.map((post) => (
            <ThreadCard
              key={post.tempId}
              thread={optimisticPostToThreadCardData(post)}
              uploading={{
                failed: post.failed,
                onDelete: () => {
                  // Unlike "Keep as draft", this has to actually undo
                  // the local staging too — nothing in S3 to clean up (a
                  // failed attempt already discarded whatever it managed
                  // to upload), but the draft entry and its IndexedDB
                  // blobs are still sitting there.
                  clearDraft();
                  for (const id of post.pendingImageIds) {
                    void deletePendingImage(id);
                  }
                  removeOptimisticPost(post.tempId);
                },
                // The draft (and its still-locally-staged images) was
                // never touched by the failed attempt — this just
                // dismisses the placeholder so the composer's own
                // "reopen draft" entry point is what picks it back up.
                onKeepDraft: () => removeOptimisticPost(post.tempId),
              }}
            />
          ))}

        {items.length === 0 ? (
          optimisticPosts.length === 0 && (
            <div className="container">
              <p className="text-muted-foreground py-16 text-center text-[13px]">
                {emptyLabel}
              </p>
            </div>
          )
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
          <div ref={sentinelRef} className="container flex justify-center py-6">
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
