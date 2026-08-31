"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

/**
 * Fullscreen image viewer — a bare `radix-ui` Dialog rather than the
 * shared `Sheet` wrapper, since `Sheet` is anchored/sized for panels
 * sliding in from an edge and this needs to be true fullscreen, black,
 * with its own swipeable carousel inside instead of `Sheet`'s slide
 * animation. Opens on whichever image was tapped (`startIndex`), and lets
 * you keep swiping through the rest of the post's images from there —
 * same gesture, just fullscreen instead of the inline strip.
 */
export function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    if (!api) return;
    // One-time read of Embla's initial position, then subscribe — not an
    // update loop, same pattern (and same lint exemption) as
    // `components/ui/carousel.tsx`'s own `onSelect` effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 container flex flex-col px-0! outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Image
          </DialogPrimitive.Title>

          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute end-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 flex size-9 items-center justify-center rounded-full bg-black/40 text-white"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
          </DialogPrimitive.Close>

          {images.length > 1 && (
            <div
              // `` pins the reading order of "1 / 3" itself —
              // without it, the Unicode Bidi Algorithm treats the digits
              // around the neutral "/" as weak characters free to
              // reorder inside an RTL ancestor, and under `dir="rtl"`
              // this rendered as "3 / 1" instead. Same fix any counter,
              // timestamp, or phone number needs in an RTL layout.

              className="absolute top-[calc(env(safe-area-inset-top)+0.9rem)] left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white"
            >
              {current + 1} / {images.length}
            </div>
          )}

          <Carousel
            setApi={setApi}
            opts={{ loop: false, startIndex }}
            className="flex flex-1 items-center"
          >
            <CarouselContent className="ms-0 h-full items-center">
              {images.map((url, index) => (
                <CarouselItem
                  key={index}
                  className="flex h-full items-center justify-center ps-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- user-supplied external URL, no image optimizer domain configured */}
                  <img
                    src={url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* `disabled:pointer-events-auto` override: at the first/last
                slide (loop:false) the button is `disabled`, and the shared
                Button's default `disabled:pointer-events-none` removes it
                from hit-testing entirely — so the click falls through to
                the fullscreen Overlay underneath and Radix treats it as an
                outside click, closing the lightbox. Keeping it hit-testable
                lets the (still inert, since `disabled` blocks the click
                event itself) button swallow the click instead. */}
            <CarouselNext className="bg-foreground! text-background! -translate-x-[250%] disabled:pointer-events-auto" />
            <CarouselPrevious className="bg-foreground! text-background! translate-x-[250%] disabled:pointer-events-auto" />
          </Carousel>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
