"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "qura:search-history";
const MAX_ENTRIES = 10;

export type SearchHistoryEntry = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

const emptySnapshot: SearchHistoryEntry[] = [];
// `useSyncExternalStore` requires the same reference back until the store
// actually changes — caching here is what keeps it from re-rendering in a
// loop, not just an optimization.
let cached: SearchHistoryEntry[] | null = null;

function readStore(): SearchHistoryEntry[] {
  if (typeof window === "undefined") return emptySnapshot;
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cached = raw ? (JSON.parse(raw) as SearchHistoryEntry[]) : emptySnapshot;
  } catch {
    cached = emptySnapshot;
  }
  return cached;
}

const listeners = new Set<() => void>();

function writeStore(next: SearchHistoryEntry[]) {
  cached = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getServerSnapshot() {
  return emptySnapshot;
}

/**
 * The last few profiles visited from the search page — purely client-side
 * (localStorage), per browser, not synced anywhere. Not a real "history"
 * feature (no dedicated backend), just a quality-of-life shortcut back to
 * profiles you were just looking at.
 */
export function useSearchHistory() {
  const entries = useSyncExternalStore(subscribe, readStore, getServerSnapshot);

  const record = useCallback((entry: SearchHistoryEntry) => {
    const next = [entry, ...readStore().filter((e) => e.id !== entry.id)].slice(
      0,
      MAX_ENTRIES,
    );
    writeStore(next);
  }, []);

  const clear = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    writeStore(emptySnapshot);
  }, []);

  return { entries, record, clear };
}
