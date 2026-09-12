import { useSyncExternalStore } from "react";

/**
 * A thread's interaction state (vote, save, follow-the-author), shared
 * across every mounted copy of its card — the feed's `ThreadCard`, the
 * one on `/thread/[id]`, one in a reply list, one in profile tabs. A
 * mutation on any of them has to reach all the others *without* a page
 * reload, including a copy Next's router cache is keeping alive in the
 * background (e.g. the feed, still mounted behind the thread detail
 * page you navigated to) — plain component-local `useState` can't do
 * that, since each `ThreadCard` instance owns its own.
 *
 * A module-level store (outside React entirely) fixes that: it survives
 * regardless of which components are currently mounted, and
 * `useSyncExternalStore` with a per-thread subscriber set means only the
 * card(s) actually showing this thread re-render on a change — not
 * every card in the tree, the way a single shared Context would.
 *
 * Deliberately not a full "normalized entity cache" (no TanStack Query,
 * no caching of the whole thread) — this only overrides the handful of
 * fields a user's own actions change. Everything else (`body`, images,
 * `replyCount`) still comes from the server as it always has.
 */
type ThreadOverride = Partial<{
  viewerVote: 1 | -1 | null;
  upvoteCount: number;
  downvoteCount: number;
  savedByViewer: boolean;
  authorFollowedByViewer: boolean;
}>;

const overrides = new Map<string, ThreadOverride>();
const listeners = new Map<string, Set<() => void>>();

function notify(threadId: string) {
  for (const listener of listeners.get(threadId) ?? []) listener();
}

export function setThreadOverride(threadId: string, patch: ThreadOverride) {
  overrides.set(threadId, { ...overrides.get(threadId), ...patch });
  notify(threadId);
}

function subscribe(threadId: string, callback: () => void) {
  let set = listeners.get(threadId);
  if (!set) {
    set = new Set();
    listeners.set(threadId, set);
  }
  set.add(callback);
  return () => {
    set!.delete(callback);
    if (set!.size === 0) listeners.delete(threadId);
  };
}

const EMPTY: ThreadOverride = {};

/** Merges any override on top of the server-supplied fields — a card
 * that's never had its own vote/save touched just reads straight
 * through to `fallback`, so there's no divergence until an action
 * actually happens somewhere. */
export function useThreadOverride(threadId: string) {
  return useSyncExternalStore(
    (callback) => subscribe(threadId, callback),
    () => overrides.get(threadId) ?? EMPTY,
    () => EMPTY,
  );
}
