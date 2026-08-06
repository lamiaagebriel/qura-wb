"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared "load more on scroll" behavior — an `IntersectionObserver` on a
 * sentinel element at the end of the list triggers `fetchMore(cursor)`,
 * appending whatever comes back. `cursor` is opaque to this hook (a
 * numeric offset for every list here, but nothing about the hook assumes
 * that) — `null` means "no more pages", which also disables the observer.
 *
 * Used by the feed, a thread's replies, profile tabs, and search — every
 * page that paginates a list of the same shape ends up with the same
 * three lines of wiring instead of reimplementing the observer each time.
 */
export function useInfiniteList<Item extends { id: string }, Cursor>({
  initialItems,
  initialCursor,
  fetchMore,
}: {
  initialItems: Item[];
  initialCursor: Cursor | null;
  fetchMore: (cursor: Cursor) => Promise<{ items: Item[]; nextCursor: Cursor | null }>;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Avoids the observer firing a second request while the first is still
  // in flight — `isLoading` state alone lags one render behind the
  // callback closure, this doesn't.
  const loadingRef = useRef(false);
  const fetchMoreRef = useRef(fetchMore);
  useEffect(() => {
    fetchMoreRef.current = fetchMore;
  });

  // `initialItems` is a fresh array every render, but its *identity* only
  // actually changes when the server component above re-fetched real
  // data — a `router.refresh()` after posting, editing, or deleting a
  // thread, for instance. `items` is this hook's own state, seeded once
  // at mount, so without this none of that would ever reach the screen:
  // the list keeps rendering whatever it already had, no matter how many
  // times the page underneath it re-fetches.
  //
  // The fresh first page always wins outright — it's where a new post
  // shows up, an edit's new text, a deletion's absence, everything. What
  // it can't know about is anything loaded *after* page one via
  // scrolling, so that gets appended back on: whatever's left in `prev`
  // once the (now-stale) copies of page one are filtered out of it.
  //
  // Done during render (React's documented pattern for "adjust state when
  // a prop changes"), not in a `useEffect` — an effect would run one
  // paint late, briefly showing the stale copy first.
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    const freshIds = new Set(initialItems.map((item) => item.id));
    setItems((prev) => [
      ...initialItems,
      ...prev.filter((item) => !freshIds.has(item.id)),
    ]);
  }

  // Lets a caller (e.g. switching the sort order) reset the list back to
  // a fresh first page without unmounting/remounting this whole hook.
  const reset = useCallback((items: Item[], nextCursor: Cursor | null) => {
    setItems(items);
    setCursor(nextCursor);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || cursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || loadingRef.current) return;
        loadingRef.current = true;
        setIsLoading(true);
        fetchMoreRef
          .current(cursor)
          .then((result) => {
            setItems((prev) => [...prev, ...result.items]);
            setCursor(result.nextCursor);
          })
          .finally(() => {
            loadingRef.current = false;
            setIsLoading(false);
          });
      },
      { rootMargin: "600px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor]);

  return { items, isLoading, hasMore: cursor !== null, sentinelRef, reset };
}
