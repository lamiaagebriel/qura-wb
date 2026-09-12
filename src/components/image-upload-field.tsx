"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  ImageAdd01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  deletePendingImage,
  putPendingImage,
} from "@/lib/threads/pending-image-store";
import { useLocale } from "@/lib/i18n/client";
import { MAX_IMAGES } from "@/lib/validations/thread";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// `crypto.randomUUID()` only exists in a secure context (HTTPS, or
// literally `localhost`) — testing over the LAN from a phone
// (`http://192.168.x.x:3000`, a plain-HTTP origin) doesn't qualify, so it
// throws there. This id only ever has to be unique within this browser's
// own `pendingImages` store and this array's own React keys — nothing
// about it needs to be cryptographically random.
let nextLocalId = 0;
function localPendingId(): string {
  nextLocalId += 1;
  return `pending-${Date.now()}-${nextLocalId}`;
}

// One image in the composer, uploaded already (edit mode's pre-existing
// images) or still staged locally (anything picked this session, in
// either mode — see `image-upload-field.tsx`'s own top comment on why
// nothing here uploads on select anymore). `new-thread-composer.tsx`
// resolves every `pending` slot to a real URL only at Post/Save time.
export type ImageSlot =
  | { kind: "uploaded"; url: string }
  | { kind: "pending"; id: string; previewUrl: string };

/**
 * Multi-photo picker for the thread composer: pick from the device
 * (multi-select in one go), reorder, drop any before publishing.
 *
 * Selecting a file no longer uploads it — it validates type/size, copies
 * the bytes into IndexedDB (`putPendingImage`, keyed by a local id) so
 * they survive a reload or a draft reopened later even if the original
 * file is gone from disk, and shows an in-memory object-URL preview.
 * Nothing here ever touches the network; the actual S3 upload happens
 * once, at Post/Save time, in `new-thread-composer.tsx`'s
 * `resolvePendingSlots` — which is also why there's no "uploading"
 * spinner in this component anymore (there's nothing in flight until
 * then).
 *
 * The preview below mirrors `ThreadImageCarousel`'s own per-count layout
 * (one full-width natural-ratio image, two side by side, three-plus as a
 * peeking scroll strip) rather than a generic grid of square thumbnails
 * — so what you see while composing is what the post will actually look
 * like. Remove/reorder controls are overlays on top of that same
 * preview.
 */
export function ImageUploadField({
  slots,
  onChange,
  disabled,
}: {
  slots: ImageSlot[];
  onChange: (slots: ImageSlot[]) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = MAX_IMAGES - slots.length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, remainingSlots);
    const added: ImageSlot[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(t("Only JPEG, PNG, WebP, or GIF images are allowed."));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(t("Images must be under 8MB."));
        continue;
      }
      const id = localPendingId();
      await putPendingImage(id, file);
      added.push({ kind: "pending", id, previewUrl: URL.createObjectURL(file) });
    }

    if (added.length > 0) onChange([...slots, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeSlot(index: number) {
    const slot = slots[index];
    if (slot.kind === "pending") {
      URL.revokeObjectURL(slot.previewUrl);
      void deletePendingImage(slot.id);
    }
    // An `"uploaded"` slot (edit mode's pre-existing image) needs no
    // cleanup here — dropping it from the array is enough;
    // `updateThreadAction`'s existing diff deletes it from S3 at Save
    // time, same as before this change.
    onChange(slots.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slots.length) return;
    const next = [...slots];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const canAddMore = remainingSlots > 0 && !disabled;

  function slotSrc(slot: ImageSlot): string {
    return slot.kind === "uploaded" ? slot.url : slot.previewUrl;
  }

  function renderOverlay(index: number) {
    return (
      <>
        <button
          type="button"
          aria-label={t("Remove this image")}
          disabled={disabled}
          onClick={() => removeSlot(index)}
          className="absolute end-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
        </button>

        {slots.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1.5 py-1">
            <button
              type="button"
              aria-label={t("Move earlier")}
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
              className="text-white disabled:opacity-30"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                className="size-3.5 rtl:rotate-180"
              />
            </button>
            <button
              type="button"
              aria-label={t("Move later")}
              disabled={disabled || index === slots.length - 1}
              onClick={() => move(index, 1)}
              className="text-white disabled:opacity-30"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3.5 rtl:rotate-180"
              />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {slots.length === 1 && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied/local-blob preview, no image optimizer domain configured */}
          <img
            src={slotSrc(slots[0])}
            alt=""
            className="border-border/50 max-h-128 w-full rounded-xl border object-cover"
          />
          {renderOverlay(0)}
        </div>
      )}

      {slots.length === 2 && (
        <div className="grid grid-cols-2 gap-1.5">
          {slots.map((slot, index) => (
            <div key={slotSrc(slot)} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied/local-blob preview, no image optimizer domain configured */}
              <img
                src={slotSrc(slot)}
                alt=""
                className="border-border/50 size-full rounded-xl border object-cover"
              />
              {renderOverlay(index)}
            </div>
          ))}
        </div>
      )}

      {slots.length >= 3 && (
        // No edge-bleed here (unlike `ThreadImageCarousel`'s own strip)
        // — this column sits beside the avatar, not flush with the
        // screen, so narrower tiles stand in for the peek instead.
        <div className="scrollbar-none flex snap-x gap-2 overflow-x-auto">
          {slots.map((slot, index) => (
            <div
              key={slotSrc(slot)}
              className="relative aspect-square w-[55%] shrink-0 snap-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied/local-blob preview, no image optimizer domain configured */}
              <img
                src={slotSrc(slot)}
                alt=""
                className="border-border/50 size-full rounded-xl border object-cover"
              />
              {renderOverlay(index)}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="w-fit gap-1.5 text-xs"
        >
          <HugeiconsIcon icon={ImageAdd01Icon} className="size-4" />
          {t("Add photos")}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
