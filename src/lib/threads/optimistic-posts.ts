import { useSyncExternalStore } from "react";

import type { ThreadCategory } from "@/db/schema";
import type { ThreadCardData } from "@/components/thread-card";

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
 * an upload is still running). Holds BOTH top-level threads
 * (`new-thread-composer.tsx`, `parentId` unset — read by `FeedThreadList`,
 * filtered to just these) and replies (`compose-box.tsx`, `parentId` set
 * to the thread being replied to — read by `ThreadReplies`, filtered to
 * the matching thread); one store rather than two since the shape and
 * every operation on it (add/update/remove by `tempId`) is identical
 * either way.
 */
export type OptimisticPost = {
  tempId: string;
  identity: { name: string; username: string; image: string | null };
  body: string;
  category: ThreadCategory;
  // Unset for a top-level thread; the thread being replied to for a
  // reply — see the store's own top comment.
  parentId?: string;
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

/** Reshapes an `OptimisticPost` into `ThreadCardData` so it can render
 * through the exact same `ThreadCard` a real thread/reply does (see
 * `ThreadCard`'s own `uploading` prop) — not a look-alike component.
 * Every count/flag below is a harmless placeholder: `uploading` disables
 * every interaction that would otherwise read them. Shared by
 * `FeedThreadList` (top-level posts) and `ThreadReplies` (replies) —
 * identical either way, only which posts each one filters to differs. */
export function optimisticPostToThreadCardData(post: OptimisticPost): ThreadCardData {
  return {
    id: post.tempId,
    body: post.body,
    images: post.previewUrls,
    createdAt: new Date(),
    category: post.category,
    author: {
      id: "optimistic",
      name: post.identity.name,
      username: post.identity.username,
      image: post.identity.image,
    },
    replyCount: 0,
    savedByViewer: false,
    authorFollowedByViewer: false,
    authorOwnedByViewer: false,
    upvoteCount: 0,
    downvoteCount: 0,
    viewerVote: null,
    markedUnhelpful: false,
  };
}
