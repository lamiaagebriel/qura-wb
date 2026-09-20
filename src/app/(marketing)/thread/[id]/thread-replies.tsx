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
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useLocale } from "@/lib/i18n/client";
import { loadMoreThreadRepliesAction } from "@/lib/threads/actions/load-more";
import type { ReplySort } from "@/lib/threads/queries";
import { deletePendingImage } from "@/lib/threads/pending-image-store";
import {
  optimisticPostToThreadCardData,
  removeOptimisticPost,
  useOptimisticPosts,
} from "@/lib/threads/optimistic-posts";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03FreeIcons } from "@hugeicons/core-free-icons";

const SORTS: ReplySort[] = ["recent", "top"];
const SORT_LABEL = { recent: "Recent", top: "Top" } as const;

/** The reply list on `/thread/[id]` — its own component (not the plain
 * `ThreadList` profile tabs use) because it also owns the Top/Recent
 * sort control, which has to reset the list to a fresh first page rather
 * than just append. */
export function ThreadReplies({
  threadId,
  initialItems,
  initialCursor,
  currentUserId,
  emptyLabel,
}: {
  threadId: string;
  initialItems: ThreadCardData[];
  initialCursor: number | null;
  currentUserId?: string;
  emptyLabel: string;
}) {
  const { t } = useLocale();
  // A reply just posted from this browser, still uploading its images in
  // the background — see `compose-box.tsx` and `optimistic-posts.ts`.
  // Filtered to this thread's own replies; the same store also holds
  // in-flight top-level posts, which `FeedThreadList` reads instead.
  const optimisticReplies = useOptimisticPosts().filter(
    (post) => post.parentId === threadId,
  );
  const [sort, setSort] = useState<ReplySort>("recent");
  const [isSorting, startSorting] = useTransition();
  const { items, isLoading, hasMore, sentinelRef, reset } = useInfiniteList<
    ThreadCardData,
    number
  >({
    initialItems,
    initialCursor,
    fetchMore: (cursor) => loadMoreThreadRepliesAction(threadId, sort, cursor),
  });

  function changeSort(next: ReplySort) {
    if (next === sort || isSorting) return;
    setSort(next);
    startSorting(async () => {
      const result = await loadMoreThreadRepliesAction(threadId, next, 0);
      reset(result.items, result.nextCursor);
    });
  }

  return (
    <div className="flex flex-col">
      {/* {items.length > 0 && (
        <div className="border-border/60 flex items-center justify-end border-b px-4 py-2">
          <Select
            value={sort}
            onValueChange={(next: ReplySort) => changeSort(next)}
            disabled={isSorting}
          >
            <SelectTrigger size="sm" aria-label={t("Sort replies")}>
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
        </div>
      )} */}

      {optimisticReplies.map((post) => (
        <ThreadCard
          key={post.tempId}
          thread={optimisticPostToThreadCardData(post)}
          variant="reply"
          uploading={{
            failed: post.failed,
            onDelete: () => {
              // No draft to clear here (unlike a top-level post's
              // "Delete") — `compose-box.tsx` has no draft concept for
              // replies, so there's only the local IndexedDB staging to
              // undo. A failed attempt already discarded whatever it
              // managed to upload to S3.
              for (const id of post.pendingImageIds) {
                void deletePendingImage(id);
              }
              removeOptimisticPost(post.tempId);
            },
            // Dismisses the failed placeholder without touching the
            // staged blobs — there's no "reopen" entry point for a
            // reply draft yet, so this just leaves them in IndexedDB
            // rather than deleting them outright.
            onKeepDraft: () => removeOptimisticPost(post.tempId),
          }}
        />
      ))}

      {items.length === 0 ? (
        optimisticReplies.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-[13px]">
            {emptyLabel}
          </p>
        )
      ) : (
        items.map((reply) => (
          <ThreadCard
            key={reply.id}
            thread={reply}
            currentUserId={currentUserId}
            variant="reply"
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
  );
}
