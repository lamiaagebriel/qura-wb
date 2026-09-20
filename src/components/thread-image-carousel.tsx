"use client";

import { useEffect, useState } from "react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ImageLightbox } from "@/components/image-lightbox";
import { cn } from "@/lib/utils";

/**
 * A thread's images, inline in the card, handled per count the way
 * Threads does — each count reads differently, so one layout for all of
 * them doesn't fit:
 * - One image sits full width at its own natural aspect ratio (capped so
 *   an extreme portrait doesn't take over the feed) — never force-cropped
 *   to a square, since a single photo *is* the post.
 * - Two sit side by side, both visible at once — nothing to swipe
 *   through, so a carousel would just hide half the post behind a swipe
 *   for no reason.
 * - Three or more become a swipeable strip, one image mostly filling the
 *   view with the next peeking in at the edge — the sliver is what says
 *   "there's more" without needing to rely on the dot indicator alone.
 *
 * Tapping any image opens `ImageLightbox` fullscreen, starting on
 * whichever one was tapped, where the same swipe continues to work
 * between the rest.
 *
 * `onClick={stopPropagation}` throughout: `ThreadCard` wraps the whole
 * card in a click-to-open-thread handler, and every tap in here (swiping,
 * opening the lightbox) needs to *not* also navigate the card away from
 * under it.
 */
export function ThreadImageCarousel({ images }: { images: string[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!api) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  if (images.length === 0) return null;

  return (
    <div
      className="relative mt-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Carousel setApi={setApi} opts={{ loop: false, dragFree: true }}>
        <CarouselContent className="ms-0 gap-0.5">
          {images.map((url, index) => (
            <CarouselItem
              key={index}
              className={cn(
                "basis-full ps-0 first:ml-20 first:rtl:mx-0 first:rtl:mr-20",
                // Peek the edge of the next image, Threads-style, instead
                // of each slide filling the full width — the sliver makes
                // "there's more" visible without needing the dots.
                images.length > 1 && "basis-1/2",
              )}
            >
              <button
                type="button"
                className="block w-full"
                aria-label="Open image"
                onClick={() => setLightboxIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied external URL, no image optimizer domain configured */}
                <img
                  src={url}
                  alt=""
                  className={cn(
                    "border-border/50 bg-muted aspect-square max-h-60 w-full rounded-sm border object-cover",
                    images.length === 1 && "w-[78%]",
                  )}
                />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1">
          {images.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === current ? "w-4 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
