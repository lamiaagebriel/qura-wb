"use client";

import type { ImageSlot } from "@/components/image-upload-field";
import { createThreadImageUploadUrlAction } from "@/lib/storage/actions";
import { getPendingImage } from "@/lib/threads/pending-image-store";

/**
 * Resolves every slot to a real, uploaded URL — `uploaded` slots already
 * are one; `pending` slots get uploaded here, in order, via the same
 * presigned-PUT flow `ImageUploadField` used to run at select time before
 * uploads were deferred to Post/Save time. Shared by the full-screen
 * composer (`new-thread-composer.tsx`) and the inline reply box
 * (`compose-box.tsx`) — both stage images the same way and both only
 * ever resolve them at their own submit time.
 *
 * On any failure partway through, returns whatever *did* finish
 * uploading THIS call (never includes already-`uploaded` slots — those
 * belong to a live thread either way and are never this function's to
 * clean up), so the caller can hand that straight to
 * `discardThreadImagesAction`.
 */
export async function resolvePendingSlots(
  slots: ImageSlot[],
): Promise<{ ok: true; urls: string[] } | { ok: false; uploadedUrls: string[] }> {
  const urls: string[] = [];
  const uploadedThisCall: string[] = [];

  for (const slot of slots) {
    if (slot.kind === "uploaded") {
      urls.push(slot.url);
      continue;
    }

    const blob = await getPendingImage(slot.id);
    if (!blob) return { ok: false, uploadedUrls: uploadedThisCall };

    const result = await createThreadImageUploadUrlAction(blob.type);
    if (!result.success) return { ok: false, uploadedUrls: uploadedThisCall };

    const res = await fetch(result.data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    if (!res.ok) return { ok: false, uploadedUrls: uploadedThisCall };

    urls.push(result.data.publicUrl);
    uploadedThisCall.push(result.data.publicUrl);
  }

  return { ok: true, urls };
}
