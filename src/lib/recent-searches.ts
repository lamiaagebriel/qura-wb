"use client";

import { useSyncExternalStore } from "react";

const KEY = "qura:recent-searches";
const MAX = 8;
const EMPTY: string[] = [];

let cache: string[] | null = null;
const listeners = new Set<() => void>();

// localStorage can throw (private mode, blocked storage) — never break on it.
function read(): string[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((q) => typeof q === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The phone's recent searches (newest first), kept on this device only. */
export function useRecentSearches() {
  const recent = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    recent,
    /** Moves `query` to the top (case-insensitive dedupe), keeps the last 8. */
    add(query: string) {
      const q = query.trim();
      if (!q) return;
      write([q, ...read().filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, MAX));
    },
    remove(query: string) {
      write(read().filter((r) => r !== query));
    },
    clear() {
      write([]);
    },
  };
}
