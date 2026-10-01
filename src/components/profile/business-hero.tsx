import { MapEmbed } from "@/components/map-embed";
import { StackLink } from "@/components/navigation/stack-link";
import { categoryOf } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { href } from "@/lib/routes";

import { BusinessDetails } from "./business-details";
import type { BusinessLocation, BusinessProfile } from "./fake-profile";
import type { ReviewSummary } from "./fake-reviews";
import { Bio, compactNumber, Count, HeroTop, ProfileName } from "./hero-parts";
import {
  formatTime,
  formatWeekday,
  isAllDay,
  openingStatus,
} from "./opening-hours";

/**
 * Business profile top: logo, name, category · handle, followers, bio,
 * the buttons, then the details card (hours, links, address/branches —
 * rows that slide open — and the first branch's map).
 * `actions`: the owner's (edit, share) or a visitor's (follow, order).
 * `rating`: the card's Reviews row, which opens the reviews screen.
 */
export async function BusinessHero({
  profile,
  rating,
  actions,
}: {
  profile: BusinessProfile;
  rating: ReviewSummary;
  actions: React.ReactNode;
}) {
  const { t, locale } = await getTranslations();
  const category = categoryOf(profile.category);
  // Written by the owner; shown in the app language (English if missing).
  const name = inLocale(profile.name, locale);
  const [first, ...others] = profile.locations;
  const reviewsHref = href("businessReviews", {
    params: { username: profile.username },
  });

  // Worked out here so the server and the browser agree on "now".
  const status = openingStatus(profile.hours, profile.timeZone);
  const { next } = status;
  let detail: string | null = null;
  if (status.open && isAllDay(profile.hours[status.today])) {
    detail = t("Open 24 hours");
  } else if (next) {
    const time = formatTime(next.time, locale);
    if (status.open) detail = t("Closes {{time}}", { time });
    else if (next.day === status.today) detail = t("Opens {{time}}", { time });
    else if (next.day === (status.today + 1) % 7)
      detail = t("Opens tomorrow {{time}}", { time });
    else
      detail = t("Opens {{day}} {{time}}", {
        day: formatWeekday(next.day, locale),
        time,
      });
  }
  const days = profile.hours.map((slot, day) => ({
    label: formatWeekday(day, locale),
    hours: isAllDay(slot)
      ? t("Open 24 hours")
      : slot
        ? `${formatTime(slot.open, locale)} – ${formatTime(slot.close, locale)}`
        : t("Closed"),
    today: day === status.today,
  }));

  return (
    <>
      <HeroTop profile={profile} name={name} fallbackIcon={category?.icon}>
        <ProfileName
          profile={profile}
          name={name}
          verifiedLabel={t("Verified")}
        />
        <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          {category && (
            <>
              <StackLink
                href={href("category", { params: { slug: category.slug } })}
                className="shrink-0 font-medium text-foreground"
              >
                {category.name[locale]}
              </StackLink>
              <span aria-hidden>·</span>
            </>
          )}
          <bdi dir="ltr" className="truncate">
            @{profile.username}
          </bdi>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          <Count
            count={profile.stats.followers}
            shown={compactNumber(locale).format(profile.stats.followers)}
            english={{
              one: "{{count}} follower",
              other: "{{count}} followers",
            }}
          />
        </p>
      </HeroTop>

      {actions}

      <Bio text={inLocale(profile.bio, locale)} />

      <BusinessDetails
        hours={{ open: status.open, detail, days }}
        socials={profile.socials}
        address={branchOf(first, locale)}
        otherBranches={others.map((branch) => branchOf(branch, locale))}
        reviews={{ ...rating, href: reviewsHref }}
        map={
          <MapPreview
            location={first.coords}
            href={mapsHrefOf(first)}
            label={t("Open in Maps")}
            locale={locale}
          />
        }
      />
    </>
  );
}

/** A branch's pin in Google Maps (the app on phones that have it). */
const mapsHrefOf = ({ coords }: BusinessLocation) =>
  `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

const branchOf = (location: BusinessLocation, locale: Locale) => ({
  description: inLocale(location.description, locale),
  mapsHref: mapsHrefOf(location),
});

/**
 * A small Google map with the business's pin, in the app language. Uses
 * Google's keyless embed (not an official API, so no key or billing; no
 * custom styling either). The map doesn't take touches — dragging over it
 * scrolls the page — and tapping it opens the pin in Google Maps.
 */
function MapPreview({
  location,
  href,
  label,
  locale,
}: {
  location: { lat: number; lng: number };
  href: string;
  label: string;
  locale: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="relative block h-40 overflow-hidden bg-muted"
    >
      <MapEmbed location={location} label={label} locale={locale} />
    </a>
  );
}
