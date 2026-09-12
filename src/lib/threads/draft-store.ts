"use client";

import type { ThreadCategory } from "@/db/schema";

const DRAFT_STORAGE_KEY = "qura:new-thread-draft";

// `pendingImageIds` point into `pending-image-store.ts`'s IndexedDB —
// nothing is ever pre-uploaded for a create-mode draft anymore (see
// `new-thread-composer.tsx`'s submit flow), so there's no separate
// `images: string[]` of already-uploaded URLs to carry here the way the
// old draft shape did.
export type Draft = {
  body: string;
  category?: ThreadCategory;
  pendingImageIds: string[];
};

export function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.body === "string" &&
      Array.isArray(parsed?.pendingImageIds)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: Draft) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}
