import type { Metadata } from "next";

import { AppHeader } from "@/components/app-header";
import { getActiveCity } from "@/lib/city/actions";
import { CITY_LABEL } from "@/lib/city/cities";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Maps")} — Qura` };
}

export default async function MapsPage() {
  const [{ t }, city] = await Promise.all([getLocale(), getActiveCity()]);

  // The public `?q=...&output=embed` form — no API key needed (same
  // reasoning as `googleMapsEmbedUrl` in `lib/location.ts`), just a text
  // query here instead of a pinned lat/lng, since a whole city isn't one
  // point on the map the way a single business's location is.
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(`${t(CITY_LABEL[city])}, Egypt`)}&output=embed`;

  return (
    <div className="flex flex-col">
      {/* A bottom-nav root tab, same as Feed/Search/Categories — no back
          button, since there's no single "parent" screen to return to. */}
      {/* <AppHeader title={t("Maps")} showBack={false} /> */}

      <iframe
        title={t("Maps")}
        src={embedUrl}
        className="h-screen w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
