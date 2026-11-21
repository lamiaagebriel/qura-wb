"use client";

import { useRef } from "react";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  HugeiconsIcon,
  ImageAdd01Icon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { useLocale } from "@/lib/i18n/provider";
import {
  IMAGE_TYPES,
  isImageType,
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
} from "@/lib/post-images";
import { cn } from "@/lib/utils";
import { createImageUpload } from "@/server/actions/post-images";

/**
 * A photo in the picker: already on the post (editing), or picked now —
 * kept on the phone (a preview URL) until the post is sent, so backing out
 * uploads nothing.
 */
export type PhotoSlot =
  | { kind: "uploaded"; url: string }
  | { kind: "picked"; file: File; preview: string };

export const photoSlots = (urls: string[]): PhotoSlot[] =>
  urls.map((url) => ({ kind: "uploaded", url }));

const src = (slot: PhotoSlot) =>
  slot.kind === "uploaded" ? slot.url : slot.preview;

/**
 * Uploads the picked photos, in order, straight to storage (a one-time URL
 * each, `createImageUpload`); the post then sends the URLs. Run from the
 * form's action, so it's part of "Posting…".
 */
export async function uploadPhotos(
  slots: PhotoSlot[],
): Promise<ActionResult<string[]>> {
  const urls: string[] = [];
  for (const slot of slots) {
    if (slot.kind === "uploaded") {
      urls.push(slot.url);
      continue;
    }
    const signed = await createImageUpload(slot.file.type);
    if (!signed.ok) return signed;
    const response = await fetch(signed.data.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": slot.file.type },
      body: slot.file,
    }).catch(() => null);
    // shortcut: a photo uploaded before a later one fails stays in the bucket unused; add a sweep if that adds up.
    if (!response?.ok) return fail("Couldn't upload the photos. Try again.");
    urls.push(signed.data.url);
  }
  return ok(urls);
}

/**
 * The post's photos while writing it: pick several at once (up to
 * `MAX_IMAGES`), drop or reorder any. The preview is laid out like the
 * post will be (`PostImages`): one wide, two or more
 * as a sideways strip.
 */
export function PhotosField({
  slots,
  onChange,
  disabled,
}: {
  slots: PhotoSlot[];
  onChange: (slots: PhotoSlot[]) => void;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const room = MAX_IMAGES - slots.length;

  const add = (files: FileList | null) => {
    const picked: PhotoSlot[] = [];
    for (const file of Array.from(files ?? []).slice(0, room)) {
      if (!isImageType(file.type)) {
        toast.add({
          title: t("Only JPEG, PNG, WebP or GIF photos."),
          type: "error",
        });
      } else if (file.size > MAX_IMAGE_BYTES) {
        toast.add({ title: t("Photos must be under 8 MB."), type: "error" });
      } else {
        picked.push({
          kind: "picked",
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }
    if (picked.length) onChange([...slots, ...picked]);
    if (input.current) input.current.value = "";
  };

  const remove = (index: number) => {
    const slot = slots[index];
    if (slot.kind === "picked") URL.revokeObjectURL(slot.preview);
    onChange(slots.filter((_, i) => i !== index));
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...slots];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };

  const tile = (slot: PhotoSlot, index: number, className: string) => (
    <div
      key={src(slot)}
      className={cn("relative overflow-hidden rounded-xl bg-muted", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a local preview or the bucket's URL */}
      <img src={src(slot)} alt="" className="size-full object-cover" />
      <Button
        type="button"
        size="icon-sm"
        variant="secondary"
        aria-label={t("Remove photo")}
        disabled={disabled}
        onClick={() => remove(index)}
        className="absolute end-1.5 top-1.5 rounded-full bg-black/60 text-white hover:bg-black/70"
      >
        <HugeiconsIcon icon={Cancel01Icon} />
      </Button>
      {slots.length > 1 && (
        <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-label={t("Move earlier")}
            disabled={disabled || index === 0}
            onClick={() => move(index, -1)}
            className="rounded-full bg-black/60 text-white hover:bg-black/70 disabled:opacity-0"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="rtl:rotate-180" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            aria-label={t("Move later")}
            disabled={disabled || index === slots.length - 1}
            onClick={() => move(index, 1)}
            className="rounded-full bg-black/60 text-white hover:bg-black/70 disabled:opacity-0"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {slots.length === 1 && tile(slots[0], 0, "aspect-8/5")}
      {slots.length > 1 && (
        <div className="-mx-4 flex snap-x scroll-px-4 gap-1.5 overflow-x-auto px-4 scrollbar-none">
          {slots.map((slot, i) =>
            tile(slot, i, "aspect-4/5 w-[62%] shrink-0 snap-start"),
          )}
        </div>
      )}
      {room > 0 && (
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="h-11 w-fit gap-2 rounded-full px-4"
        >
          <HugeiconsIcon icon={ImageAdd01Icon} />
          {t("Add photos")}
          {slots.length > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {slots.length}/{MAX_IMAGES}
            </span>
          )}
        </Button>
      )}
      <input
        ref={input}
        type="file"
        accept={Object.keys(IMAGE_TYPES).join(",")}
        multiple
        hidden
        onChange={(event) => add(event.target.files)}
      />
    </div>
  );
}
