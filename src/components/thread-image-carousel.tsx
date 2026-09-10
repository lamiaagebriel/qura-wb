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
 * A thread's images, inline in the card — a single image renders full
 * width same as before; more than one becomes a swipeable strip (one
 * full-width slide at a time, dot indicator underneath) rather than the
 * old static 2-col grid, since a grid doesn't tell you there's more to
 * see past what's visible. Tapping any image opens `ImageLightbox`
 * fullscreen, starting on whichever one was tapped, where the same swipe
 * continues to work between the rest.
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
      <Carousel setApi={setApi} opts={{ loop: false, dragFree: images.length > 1 }}>
        <CarouselContent className={cn("ms-0", images.length > 1 && "gap-2")}>
          {images.map((url, index) => (
            <CarouselItem
              key={index}
              className={cn(
                "ps-0",
                // Peek the edge of the next image, Threads-style, instead
                // of each slide filling the full width — the sliver makes
                // "there's more" visible without needing the dots.
                images.length > 1 && "basis-[88%]",
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
                    "border-border/50 w-full rounded-xl border object-cover",
                    images.length === 1 ? "max-h-96" : "aspect-square",
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
