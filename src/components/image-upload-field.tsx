"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  ImageAdd01Icon,
  Loading03FreeIcons,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  createThreadImageUploadUrlAction,
  discardThreadImagesAction,
} from "@/lib/storage/actions";
import { useLocale } from "@/lib/i18n/client";
import { MAX_IMAGES } from "@/lib/validations/thread";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// `crypto.randomUUID()` only exists in a secure context (HTTPS, or
// literally `localhost`) — testing over the LAN from a phone
// (`http://192.168.x.x:3000`, a plain-HTTP origin) doesn't qualify, so it
// throws there. This id is purely a local React key for one in-flight
// upload's placeholder tile; nothing about it needs to be
// cryptographically random or unique outside this component's own state.
let nextLocalId = 0;
function localUploadId(): string {
  nextLocalId += 1;
  return `upload-${nextLocalId}`;
}

type Uploading = {
  id: string;
  previewUrl: string;
  error: boolean;
};

/**
 * Multi-photo picker for the thread composer: pick from the device
 * (multi-select in one go), reorder, drop any before publishing — the
 * upload itself happens the moment a file is picked (straight to S3 via
 * a presigned URL from `createThreadImageUploadUrlAction`, never through
 * this app's own server), so by the time you hit Post every thumbnail
 * you see is already a real, live URL.
 *
 * `sessionUploadsRef` is how the composer around this knows what to
 * clean up if the draft gets discarded instead of published — every URL
 * this component successfully uploads gets added to it, *including* ones
 * later removed here, since removing one here already deletes it (see
 * `removeImage`) and a redundant delete of an already-gone key is a
 * harmless no-op. What `sessionUploadsRef` really exists for is edit
 * mode: images the thread already had before this edit started are
 * never added to it, so canceling an edit never deletes something still
 * attached to the live thread — only `updateThreadAction`'s own diff (on
 * an actual save) is allowed to remove those.
 */
export function ImageUploadField({
  images,
  onChange,
  sessionUploadsRef,
  disabled,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  sessionUploadsRef: React.RefObject<Set<string>>;
  disabled?: boolean;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  // Read inside async upload loops instead of the `images` prop directly
  // — `onChange` doesn't take effect until the parent re-renders, so a
  // second file finishing its upload before that happens would otherwise
  // clobber the first one's append instead of stacking on top of it.
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const remainingSlots = MAX_IMAGES - images.length - uploading.length;

  async function uploadOne(file: File) {
    const localId = localUploadId();
    const previewUrl = URL.createObjectURL(file);
    setUploading((prev) => [...prev, { id: localId, previewUrl, error: false }]);

    try {
      const result = await createThreadImageUploadUrlAction(file.type);
      if (!result.success) {
        throw new Error(result.error.kind === "message" ? result.error.message : undefined);
      }

      const res = await fetch(result.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error();

      sessionUploadsRef.current.add(result.data.publicUrl);
      imagesRef.current = [...imagesRef.current, result.data.publicUrl];
      onChange(imagesRef.current);
      setUploading((prev) => prev.filter((u) => u.id !== localId));
    } catch (err) {
      setUploading((prev) =>
        prev.map((u) => (u.id === localId ? { ...u, error: true } : u)),
      );
      toast.error(err instanceof Error && err.message ? err.message : t("Couldn't upload that image."));
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, remainingSlots);

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(t("Only JPEG, PNG, WebP, or GIF images are allowed."));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(t("Images must be under 8MB."));
        continue;
      }
      // Sequential, not `Promise.all` — keeps `imagesRef`'s append order
      // matching the order the user picked files in, and there's never
      // more than `MAX_IMAGES` of these at once anyway.
      await uploadOne(file);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(url: string) {
    onChange(images.filter((u) => u !== url));
    // Only ever deletes something this exact component instance
    // uploaded — a pre-existing image (edit mode) just gets dropped from
    // the array here; `updateThreadAction` is what actually deletes it
    // from S3, and only once the edit is really saved.
    if (sessionUploadsRef.current.has(url)) {
      sessionUploadsRef.current.delete(url);
      void discardThreadImagesAction([url]);
    }
  }

  function retryUpload(item: Uploading) {
    setUploading((prev) => prev.filter((u) => u.id !== item.id));
  }

  function move(index: number, direction: -1 | 1) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const canAddMore = remainingSlots > 0 && !disabled;

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((url, index) => (
        <div
          key={url}
          className="group border-border/60 relative size-20 overflow-hidden rounded-lg border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied external URL, no image optimizer domain configured */}
          <img src={url} alt="" className="size-full object-cover" />

          <button
            type="button"
            aria-label={t("Remove this image")}
            disabled={disabled}
            onClick={() => removeImage(url)}
            className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-3" />
          </button>

          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1 py-0.5">
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
                disabled={disabled || index === images.length - 1}
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
        </div>
      ))}

      {uploading.map((item) => (
        <div
          key={item.id}
          className={cn(
            "relative size-20 overflow-hidden rounded-lg border",
            item.error ? "border-destructive" : "border-border/60",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote image */}
          <img
            src={item.previewUrl}
            alt=""
            className="size-full object-cover opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            {item.error ? (
              <button
                type="button"
                aria-label={t("Remove this image")}
                onClick={() => retryUpload(item)}
                className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <HugeiconsIcon icon={Alert02Icon} className="size-4" />
              </button>
            ) : (
              <HugeiconsIcon
                icon={Loading03FreeIcons}
                strokeWidth={2.5}
                className="size-5 animate-spin text-white"
              />
            )}
          </div>
        </div>
      ))}

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="size-20 flex-col gap-1 text-xs"
        >
          <HugeiconsIcon icon={ImageAdd01Icon} className="size-5" />
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
