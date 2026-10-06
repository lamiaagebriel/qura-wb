"use client";

import { useEffect, useState } from "react";

import { StackLink } from "@/components/navigation/stack-link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useLocale } from "@/lib/i18n/provider";
import { inLocale, type Localized } from "@/lib/localized";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type Ad = {
  id: string;
  /** The business it promotes (the slide opens its profile). */
  username: string;
  title: Localized;
  subtitle: Localized;
  /** Banner photo; without one the slide shows `tint`. */
  imageUrl?: string;
  tint: string;
};

// UI only for now: sample slides until ads are stored and sold.
export const SAMPLE_ADS: Ad[] = [
  {
    id: "1",
    username: "nilebreeze",
    title: { en: "Breakfast on the Nile", ar: "فطور على النيل", fr: "Petit-déj sur le Nil" },
    subtitle: { en: "20% off before 10 am", ar: "خصم ٢٠٪ قبل ١٠ صباحًا", fr: "-20 % avant 10 h" },
    tint: "from-amber-500 to-rose-500",
  },
  {
    id: "2",
    username: "salon.nefertari",
    title: { en: "Bridal packages", ar: "باقات العرائس", fr: "Forfaits mariée" },
    subtitle: { en: "Book your date now", ar: "احجزي موعدك الآن", fr: "Réservez votre date" },
    tint: "from-fuchsia-500 to-indigo-500",
  },
  {
    id: "3",
    username: "aswan.eats",
    title: { en: "Free delivery", ar: "توصيل مجاني", fr: "Livraison gratuite" },
    subtitle: { en: "All over Aswan this week", ar: "لكل أسوان هذا الأسبوع", fr: "Dans tout Assouan cette semaine" },
    tint: "from-emerald-500 to-teal-600",
  },
];

const AUTOPLAY_MS = 5000;

/**
 * Sponsored banners: one wide slide at a time, swipeable, looping, with dots.
 * Advances every few seconds unless the user is touching it or prefers
 * reduced motion.
 */
export function AdCarousel({ ads = SAMPLE_ADS }: { ads?: Ad[] }) {
  const { t, locale, dir } = useLocale();
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

  if (!ads.length) return null;

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true, direction: dir }}
      aria-label={t("Sponsored")}
      className="px-4"
    >
      <CarouselContent>
        {ads.map((ad, i) => (
          <CarouselItem
            key={ad.id}
            aria-label={t("{{n}} of {{total}}", { n: i + 1, total: ads.length })}
          >
            <StackLink
              href={href("business", { params: { username: ad.username } })}
              className={cn(
                "relative flex aspect-[2/1] flex-col justify-end overflow-hidden rounded-2xl bg-linear-to-br p-4 text-start text-white",
                ad.tint,
              )}
            >
              {ad.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                />
              )}
              {/* Keeps the text readable over any photo. */}
              <span className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute top-3 start-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                {t("Sponsored")}
              </span>
              <span className="relative flex flex-col gap-0.5">
                <span dir="auto" className="text-xl font-bold leading-tight">
                  {inLocale(ad.title, locale)}
                </span>
                <span dir="auto" className="text-sm opacity-90">
                  {inLocale(ad.subtitle, locale)}
                </span>
              </span>
            </StackLink>
          </CarouselItem>
        ))}
      </CarouselContent>
      {ads.length > 1 && (
        <div aria-hidden className="mt-2.5 flex justify-center gap-1.5">
          {ads.map((ad, i) => (
            <span
              key={ad.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === current ? "w-4 bg-primary" : "w-1.5 bg-foreground/20",
              )}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
}
