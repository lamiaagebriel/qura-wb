"use client";

import { useEffect, useState } from "react";

import { HugeiconsIcon, ImageAdd01Icon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** A banner: a business's post with a photo (`latestPosts` `promoted`). */ export type Ad =
  {
    id: string;
    /** Where it opens: the post. */ href: string;
    /** The business. */ title: string;
    /** The post's text (cut to two lines). */ subtitle: string;
    imageUrl: string;
  };
const AUTOPLAY_MS = 5000;

// The photo fading in under the header (both spellings: Safari wants -webkit-).
const FADE_IN =
  "linear-gradient(to bottom, transparent, rgb(0 0 0 / 0.35) 1.75rem, rgb(0 0 0 / 0.8) 3.5rem, black 5.5rem)";

/**
 * The page's hero: businesses' photo posts as full-width slides under the
 * header: each photo whole from the header down, a blur of it behind the header;
 * swipeable, looping, with dots; each opens its post.
 * Advances every few seconds unless the user is touching it or prefers
 * reduced motion.
 */
export function AdCarousel({ ads }: { ads: Ad[] }) {
  const { t, dir } = useLocale();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("pointerDown", () => setPaused(true));
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused || ads.length < 2) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [api, paused, ads.length]);

  if (!ads.length) return <AdInvite />;

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true, direction: dir }}
      aria-label={t("Sponsored")}
      // The top of the page: edge to edge, starting under the (clear) header.
      className="-mt-[calc(2.75rem+var(--safe-top)+0.25rem)]"
    >
      <CarouselContent className="ms-0">
        {ads.map((ad, i) => (
          <CarouselItem
            key={ad.id}
            className="ps-0"
            aria-label={t("{{n}} of {{total}}", {
              n: i + 1,
              total: ads.length,
            })}
          >
            <AdLink
              href={ad.href}
              className="relative flex h-[30rem] flex-col justify-end overflow-hidden bg-muted px-4 pt-4 pb-9 text-start text-white"
            >
              {/* Behind everything, under the header too: the photo, blurred. */}
              <Blur className="h-full" url={ad.imageUrl} />
              <span className="absolute inset-x-0 top-0 h-[calc(2.75rem+var(--safe-top)+3rem)] bg-linear-to-b from-background/30 via-background/10 to-transparent" />
              {/* The photo itself, whole: fading in from behind the header,
                  its top melting gently (over ~5rem) into the blur above. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- photos come from the bucket */}
              <img
                src={ad.imageUrl}
                alt=""
                className="absolute inset-x-0 top-[calc(var(--safe-top)+1rem)] bottom-0 size-auto w-full object-cover"
                style={{ maskImage: FADE_IN, WebkitMaskImage: FADE_IN }}
              />
              {/* A dark fade at the bottom keeps the text readable. */}
              <span className="absolute inset-0 bg-linear-to-t from-black/65 via-black/15 via-40% to-transparent" />

              <span className="relative flex flex-col gap-1">
                <span className="w-fit rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                  {t("Sponsored")}
                </span>
                <span dir="auto" className="text-2xl leading-tight font-bold">
                  {ad.title}
                </span>
                <span dir="auto" className="line-clamp-2 text-sm text-white/80">
                  {ad.subtitle}
                </span>
              </span>
            </AdLink>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* The dots, under the text. */}
      {ads.length > 1 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5"
        >
          {ads.map((ad, i) => (
            <span
              key={ad.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current ? "w-4 bg-white" : "w-1.5 bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
}

/** A heavily blurred copy of the photo, masked by `className` (where it shows). */
function Blur({ url, className }: { url: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative copy of the slide's photo
    <img
      src={url}
      alt=""
      aria-hidden
      className={cn(
        "absolute inset-x-0 top-0 h-full w-full scale-110 object-cover blur-2xl",
        className,
      )}
    />
  );
}

/**
 * No ads yet: the hero invites businesses to fill it — the same full-width
 * top (a soft gradient where the photo goes), "Your business here" and
 * "Create yours", which opens a new offer (signing in first if needed).
 */
function AdInvite() {
  const { t } = useLocale();
  return (
    <div className="relative -mt-[calc(2.75rem+var(--safe-top)+0.25rem)] flex h-[22rem] flex-col justify-end overflow-hidden bg-linear-to-br from-primary/15 via-muted to-background px-4 pt-[calc(2.75rem+var(--safe-top))] pb-8">
      <HugeiconsIcon
        icon={ImageAdd01Icon}
        aria-hidden
        className="absolute end-6 top-[calc(2.75rem+var(--safe-top)+2rem)] size-28 rotate-12 text-foreground/5"
      />
      <span className="flex flex-col gap-2">
        <span className="w-fit rounded-full bg-foreground/10 px-2 py-0.5 text-[11px] font-medium">
          {t("Sponsored")}
        </span>
        <span className="text-2xl leading-tight font-bold">
          {t("Your business here")}
        </span>
        <span className="text-sm text-muted-foreground">
          {t(
            "Post an ad with a photo and it shows here, at the top of everyone's home.",
          )}
        </span>
        <StackLink
          href={href("newPost", { query: { type: "ad" } })}
          className="mt-2 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[scale] active:scale-95 motion-reduce:transition-none"
        >
          <HugeiconsIcon icon={ImageAdd01Icon} className="size-5" />
          {t("Create yours")}
        </StackLink>
      </span>
    </div>
  );
}

/** An in-app page slides in (`StackLink`); an outside link opens in a new tab. */
function AdLink({
  href,
  ...props
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  return /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props} />
  ) : (
    <StackLink href={href} {...props} />
  );
}
