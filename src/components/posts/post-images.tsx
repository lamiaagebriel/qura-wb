"use client";

import { useState } from "react";

import { Cancel01Icon, HugeiconsIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * A post's photos, laid out by how many there are (as Threads does):
 * - one: full width at 8:5 (cropped to fill);
 * - two or more: a sideways strip, the next one peeking in (that sliver
 *   says "there's more").
 * Tapping one opens it fullscreen (`PhotoViewer`), swiping on to the rest.
 */
export function PostImages({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;

  const photo = (url: string, index: number, frame: string) => (
    <button
      key={url}
      type="button"
      aria-label={t("Photo {{index}} of {{count}}", {
        index: index + 1,
        count: images.length,
      })}
      onClick={() => setOpen(index)}
      className={cn(
        "overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/5",
        frame,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- photos come from the bucket, any size */}
      <img src={url} alt="" loading="lazy" className="size-full object-cover" />
    </button>
  );

  return (
    <div className={className}>
      {images.length === 1 && photo(images[0], 0, "block aspect-8/5 w-full")}
      {images.length > 1 && (
        // Starts in line with the text, then slides under the avatar column
        // and the post's padding (4.25rem) to its start edge, and to its end edge (1rem).
        <div className="-ms-[4.25rem] -me-4 flex snap-x scroll-ps-[4.25rem] gap-1.5 overflow-x-auto ps-[4.25rem] pe-4 scrollbar-none">
          {images.map((url, i) =>
            photo(url, i, "aspect-4/5 w-[62%] shrink-0 snap-start"),
          )}
        </div>
      )}
      {open !== null && (
        <PhotoViewer
          images={images}
          start={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/** Fullscreen and black: swipe between the photos, "2 / 4" at the top. */
function PhotoViewer({
  images,
  start,
  onClose,
}: {
  images: string[];
  start: number;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [current, setCurrent] = useState(start);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 top-0 start-0 block h-(--app-height) w-full max-w-none translate-x-0 translate-y-0 rounded-none bg-black p-0 ring-0 sm:max-w-none rtl:translate-x-0"
      >
        <DialogTitle className="sr-only">
          {t("Photo {{index}} of {{count}}", {
            index: current + 1,
            count: images.length,
          })}
        </DialogTitle>
        <div
          // Opens on the photo that was tapped (any writing direction).
          ref={(el) =>
            el?.children[start]?.scrollIntoView({
              inline: "start",
              behavior: "instant",
            })
          }
          onScroll={(event) => {
            const el = event.currentTarget;
            setCurrent(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
          }}
          className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-contain scrollbar-none"
        >
          {images.map((url) => (
            <div
              key={url}
              className="flex size-full shrink-0 snap-center items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- photos come from the bucket, any size */}
              <img
                src={url}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <bdi
            dir="ltr"
            className="absolute start-1/2 top-[calc(var(--safe-top)+1rem)] -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white tabular-nums rtl:translate-x-1/2"
          >
            {current + 1} / {images.length}
          </bdi>
        )}
        <DialogClose
          render={
            <Button
              size="icon-lg"
              variant="ghost"
              aria-label={t("Close")}
              className="absolute end-3 top-[calc(var(--safe-top)+0.5rem)] size-11 rounded-full bg-white/15 text-white hover:bg-white/25 hover:text-white"
            />
          }
        >
          <HugeiconsIcon icon={Cancel01Icon} />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
