import { useSyncExternalStore } from "react";

import type { ThreadCategory } from "@/db/schema";

/**
 * A thread that's been "posted" from the user's point of view — the
 * composer closed and the feed shows it — but hasn't actually reached
 * the server yet, because its images are still uploading in the
 * background (see `new-thread-composer.tsx`'s submit flow). No DB
 * schema change backs this: the real `threads` row is only ever created
 * once the upload succeeds, so this is purely a client-side illusion,
 * visible only to the person who posted it, only in their own browser.
 *
 * Same module-level-store-outside-React shape as `overrides.ts` (and for
 * the same reason: survives regardless of which components are
 * currently mounted, e.g. navigating away from the feed and back while
 * an upload is still running). Only `FeedThreadList` reads this — the
 * composer this feeds is create-only for top-level threads (replies go
 * through the separate `compose-box.tsx`), so the feed is the only place
 * a new post can ever land.
 */
export type OptimisticPost = {
  tempId: string;
  identity: { name: string; username: string; image: string | null };
  body: string;
  category: ThreadCategory;
  // Local blob preview URLs, in post order — never a real S3 URL; the
  // card renders straight from these until the real thread replaces it.
  previewUrls: string[];
  // The same images' ids in `pending-image-store.ts`'s IndexedDB — kept
  // alongside `previewUrls` so a failed post's "Delete" action can
  // actually clean up the staged blobs, not just dismiss the card.
  pendingImageIds: string[];
  failed: boolean;
};

let posts: OptimisticPost[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function addOptimisticPost(post: OptimisticPost) {
  posts = [post, ...posts];
  notify();
}

export function updateOptimisticPost(
  tempId: string,
  patch: Partial<OptimisticPost>,
) {
  posts = posts.map((p) => (p.tempId === tempId ? { ...p, ...patch } : p));
  notify();
}

export function removeOptimisticPost(tempId: string) {
  posts = posts.filter((p) => p.tempId !== tempId);
  notify();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

const EMPTY: OptimisticPost[] = [];

export function useOptimisticPosts(): OptimisticPost[] {
  return useSyncExternalStore(
    subscribe,
    () => posts,
    () => EMPTY,
  );
}
