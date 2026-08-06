"use client";

import { ThreadCard, type ThreadCardData } from "@/components/thread-card";
import { useInfiniteList } from "@/hooks/use-infinite-list";
import { useLocale } from "@/lib/i18n/client";
import {
  Loading,
  Loading01FreeIcons,
  Loading01Icon,
  Loading02FreeIcons,
  Loading03FreeIcons,
  Loading04FreeIcons,
  Spinner,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/** Plain "load more on scroll" list of threads — the feed and a profile's
 * Threads/Replies tabs are all just this with a different `fetchMore`.
 * `/thread/[id]`'s own reply list is its own component instead
 * (`ThreadReplies`) since it also needs the Top/Recent sort control. */
export function ThreadList({
  initialItems,
  initialCursor,
  fetchMore,
  currentUserId,
  emptyLabel,
}: {
  initialItems: ThreadCardData[];
  initialCursor: number | null;
  fetchMore: (
    cursor: number,
  ) => Promise<{ items: ThreadCardData[]; nextCursor: number | null }>;
  currentUserId?: string;
  emptyLabel: string;
}) {
  const { t } = useLocale();
  const { items, isLoading, hasMore, sentinelRef } = useInfiniteList({
    initialItems,
    initialCursor,
    fetchMore,
  });

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-[13px]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="container flex flex-col">
      {items.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          currentUserId={currentUserId}
        />
      ))}

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
