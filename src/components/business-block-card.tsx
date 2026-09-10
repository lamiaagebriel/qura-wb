"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Call02Icon,
  GlobalIcon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons";

import { CATEGORY_META } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/client";
import type { Dict } from "@/lib/i18n/config";
import type { BusinessCategory } from "@/db/schema";
import {
  googleMapsEmbedUrl,
  googleMapsUrl,
  type Location,
} from "@/lib/location";
import { detectSocialPlatform } from "@/lib/social";
import {
  DAYS,
  DAY_LABEL,
  type DayKey,
  type TimeRange,
  type WorkingHours,
} from "@/lib/working-hours";
import { buttonVariants } from "./ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Translate = (key: keyof Dict) => string;
export type Fact = { label: string; value: ReactNode };

// The one connected Google place's data this business's block is allowed
// to fall back to — never a second, separately-rendered source. See
// `BusinessBlockCard`'s own comment for the merge rule (Qura wins,
// Google only fills an actual gap).
export type GoogleFallback = {
  placeId: string;
  name: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  phoneNumber?: string;
  websiteUri?: string;
  openingHoursDescriptions?: string[];
  address?: string;
  location?: { latitude: number; longitude: number };
};

const NOT_OPERATIONAL_LABEL: Partial<Record<string, keyof Dict>> = {
  CLOSED_TEMPORARILY: "Temporarily closed",
  CLOSED_PERMANENTLY: "Permanently closed",
};

// Google's documented "Search" deep-link format — `query_place_id`
// alongside `query` pins the map on this EXACT place rather than
// re-running a text search. No API key needed. Kept local, same as
// every other place this pattern already lives in this codebase.
function googleMapsPlaceUrl(placeId: string, name: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: name,
    query_place_id: placeId,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function formatRange(range: TimeRange): string {
  return `${range.open} – ${range.close}`;
}

function getTodayKey(): DayKey {
  const days: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

function getTodaySummary(hours: WorkingHours, t: Translate): string {
  const today = hours[getTodayKey()] ?? [];
  if (today.length === 0) return t("Closed");
  return today.map(formatRange).join(", ");
}

// ─── Call Button ──────────────────────────────────────────────────────────────
//
// Exported (along with `WorkingHoursAccordion`, `LocationSection`, and
// `FactRow` below) so `google-place-info.tsx` can render a connected
// Google Place's info as more rows in the exact same visual language,
// rather than a second, visibly distinct "Google" card — see that
// file's own comment for why.

export function CallButton({ phones }: { phones: string[] }) {
  const { t } = useLocale();
  if (phones.length === 1) {
    return (
      <a
        href={`tel:${phones[0]}`}
        className="bg-muted flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5"
      >
        <HugeiconsIcon icon={Call02Icon} className="text-foreground size-4.5" />
        <span className="text-foreground text-[10.5px] font-semibold">
          {t("Call")}
        </span>
      </a>
    );
  }

  return (
    <details className="relative flex-1">
      <summary className="bg-muted flex list-none flex-col items-center gap-1.5 rounded-xl py-2.5 [&::-webkit-details-marker]:hidden">
        <HugeiconsIcon icon={Call02Icon} className="text-foreground size-4.5" />
        <span className="text-foreground text-[10.5px] font-semibold">
          {t("Call")}
        </span>
      </summary>
      <div className="border-border bg-popover absolute start-0 top-full z-10 mt-1 flex min-w-40 flex-col overflow-hidden rounded-md border py-1 shadow-md">
        {phones.map((phone, index) => (
          <a
            key={index}
            href={`tel:${phone}`}
            dir="ltr"
            className="text-foreground hover:bg-muted px-3 py-1.5 text-[12.5px]"
          >
            {phone}
          </a>
        ))}
      </div>
    </details>
  );
}

// ─── Working Hours Accordion ──────────────────────────────────────────────────

export function WorkingHoursAccordion({ hours }: { hours: WorkingHours }) {
  const { t } = useLocale();
  const todaySummary = getTodaySummary(hours, t);
  const isOpenToday = todaySummary !== t("Closed");

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full rounded-none border-0"
    >
      <AccordionItem value="hours" className="border-none">
        <AccordionTrigger
          className={cn(
            "container flex items-center justify-between gap-4 py-2 text-[12.5px] hover:no-underline",
            "[&>svg]:text-muted-foreground [&>svg]:size-3.5",
          )}
        >
          <span className="text-muted-foreground">{t("Working hours")}</span>
          <span
            className={cn(
              "font-medium",
              isOpenToday ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {todaySummary}
          </span>
        </AccordionTrigger>

        <AccordionContent className="pb-0">
          <div className="divide-border/50 flex flex-col divide-y">
            {DAYS.map((key) => {
              const ranges = hours[key] ?? [];
              const isToday = key === getTodayKey();
              const hasRanges = ranges.length > 0;

              return (
                <div
                  key={key}
                  className={cn(
                    "container flex items-start justify-between gap-4 py-2 text-[12.5px]",
                    isToday && "bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "w-24 shrink-0",
                      isToday
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground",
                    )}
                  >
                    {t(DAY_LABEL[key])}
                    {isToday && (
                      <span className="text-primary ml-1.5 text-[10px] font-normal">
                        {t("Today")}
                      </span>
                    )}
                  </span>

                  {hasRanges ? (
                    <div className="flex flex-col items-end gap-0.5">
                      {ranges.map((range, i) => (
                        <span key={i} className="text-foreground font-medium">
                          {formatRange(range)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t("Closed")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// ─── Working Hours Accordion (Google fallback) ────────────────────────────────
//
// Google's opening hours only ever come back as pre-localized display
// strings (`weekdayDescriptions`), never the structured per-day ranges
// `WorkingHoursAccordion` above expects (that shape is Qura's own
// `WorkingHours` type, filled in by a business itself) — this renders
// Google's lines directly instead of forcing them through that
// component, but keeps the identical accordion row styling. Only ever
// used when Qura has no working hours of its own to show (see the merge
// rule in `BusinessBlockCard`).

export function WorkingHoursAccordionFromDescriptions({
  lines,
}: {
  lines: string[];
}) {
  const { t } = useLocale();
  return (
    <details className="group">
      <summary className="container flex list-none items-center justify-between gap-4 py-2 text-[12.5px] [&::-webkit-details-marker]:hidden">
        <span className="text-muted-foreground">{t("Working hours")}</span>
        <span className="text-muted-foreground text-[11px] group-open:hidden">
          {t("Show hours")}
        </span>
      </summary>
      <div className="divide-border/50 flex flex-col divide-y">
        {lines.map((line, index) => (
          <div key={index} className="container py-2 text-[12.5px] text-foreground">
            {line}
          </div>
        ))}
      </div>
    </details>
  );
}

// ─── Fact Row ─────────────────────────────────────────────────────────────────

export function FactRow({ fact }: { fact: Fact }) {
  return (
    <div>
      <div className="container flex items-center justify-between gap-4 py-2 text-[12.5px]">
        <div className="text-muted-foreground">{fact.label}</div>
        <div className="text-foreground truncate font-medium">{fact.value}</div>
      </div>
    </div>
  );
}

// ─── Location Section ─────────────────────────────────────────────────────────

export function LocationSection({
  location,
  mapsUrl,
  mapsEmbedUrl,
}: {
  location: Location;
  mapsUrl: string | null;
  mapsEmbedUrl: string | null;
}) {
  const { t } = useLocale();
  return (
    <div>
      <div className="container flex flex-col gap-2 py-2.5">
        <div>
          <div className="text-foreground text-[13px] font-bold">
            {t("Location")}
          </div>
          <p className="text-muted-foreground text-[12.5px] leading-relaxed">
            {location.description}
          </p>
        </div>

        {mapsEmbedUrl && (
          <div className="border-border h-25 w-full overflow-hidden rounded-xl border">
            <iframe
              src={mapsEmbedUrl}
              title={t("Location")}
              loading="lazy"
              className="size-full border-0"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
          >
            <HugeiconsIcon icon={MapsLocation01Icon} className="size-3.5" />
            {t("Get directions")}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessBlockCard({
  category,
  data,
  google = null,
}: {
  category: BusinessCategory | null | undefined;
  data: Record<string, unknown> | null | undefined;
  // The ONE connected Google place this business's info is allowed to
  // borrow from — never rendered as its own separate section. Every
  // field below follows the same rule: Qura's own value wins whenever
  // it's set; Google's only ever fills an actual gap. This is what
  // keeps a business with, say, its own phone number AND a connected
  // Google listing from showing two "Call" buttons — there is exactly
  // one merged card, not "Qura's info, then Google's info again."
  // Fields Qura has no equivalent for at all (a public star rating, an
  // operating-status flag) always come from here when present — that's
  // additive, not duplicative, since nothing else on this card shows
  // them.
  google?: GoogleFallback | null;
}) {
  const { t } = useLocale();
  if (!category || !data) return null;

  const meta = CATEGORY_META[category];
  const qura = {
    location: data.location as Location | undefined,
    phones: data.phones as string[] | undefined,
    socialLinks: data.socialLinks as string[] | undefined,
    workingHours: data.workingHours as WorkingHours | undefined,
  };

  // ── Merge: Qura first, Google fills the gap ──────────────────────────────
  const effectivePhones =
    qura.phones && qura.phones.length > 0
      ? qura.phones
      : google?.phoneNumber
        ? [google.phoneNumber]
        : undefined;

  const quraWebsite = qura.socialLinks?.find(
    (link) => detectSocialPlatform(link).label === "Website",
  );
  const otherSocialLinks =
    qura.socialLinks?.filter(
      (link) => detectSocialPlatform(link).label !== "Website",
    ) ?? [];
  // Never itself one of `otherSocialLinks` — a Google fallback website is
  // rendered as its own tile below, not folded into that list.
  const effectiveWebsite = quraWebsite ?? google?.websiteUri;

  const effectiveWorkingHoursLines =
    !qura.workingHours && google?.openingHoursDescriptions
      ? google.openingHoursDescriptions
      : undefined;

  // A Google address only becomes a usable `Location` once it actually
  // has something to show — Qura's own `location` always wins outright.
  const effectiveLocation: Location | undefined =
    qura.location ??
    (google?.address ? { description: google.address } : undefined);
  const usingGoogleLocation = !qura.location && !!effectiveLocation;
  const mapsUrl = qura.location
    ? googleMapsUrl(qura.location)
    : usingGoogleLocation && google
      ? googleMapsPlaceUrl(google.placeId, google.name)
      : null;
  const mapsEmbedUrl = qura.location ? googleMapsEmbedUrl(qura.location) : null;

  const statusKey = google?.businessStatus
    ? NOT_OPERATIONAL_LABEL[google.businessStatus]
    : undefined;

  // ── Category-specific facts ──────────────────────────────────────────────
  const facts: Fact[] =
    category === "food-drinks"
      ? (
          [
            data.priceRange
              ? { label: t("Price range"), value: String(data.priceRange) }
              : null,
            data.deliveryAvailable
              ? { label: t("Delivery"), value: t("Available") }
              : null,
            data.reservationsAvailable
              ? { label: t("Reservations"), value: t("Available") }
              : null,
          ] as (Fact | null)[]
        ).filter((f): f is Fact => f !== null)
      : category === "health"
        ? (
            [
              data.clinicAddress
                ? {
                    label: t("Clinic address"),
                    value: String(data.clinicAddress),
                  }
                : null,
              data.appointmentPhone
                ? {
                    label: t("Appointment phone"),
                    value: String(data.appointmentPhone),
                  }
                : null,
              data.consultationFee
                ? {
                    label: t("Consultation fee"),
                    value: String(data.consultationFee),
                  }
                : null,
              data.acceptsInsurance
                ? { label: t("Insurance"), value: t("Accepted") }
                : null,
            ] as (Fact | null)[]
          ).filter((f): f is Fact => f !== null)
        : [];

  const headerLabel =
    category === "food-drinks"
      ? String(data.cuisine ?? t(meta.label))
      : category === "health"
        ? String(data.specialty ?? t(meta.label))
        : t(meta.label);

  const details = typeof data.details === "string" ? data.details : "";
  const hasContacts =
    (effectivePhones && effectivePhones.length > 0) ||
    !!effectiveWebsite ||
    otherSocialLinks.length > 0;

  return (
    <div className="divide-border/50 flex flex-col divide-y overflow-hidden">
      {/* ── Google status alert (no Qura equivalent — additive, not
          duplicative) ── */}
      {statusKey && (
        <div className="container py-2">
          <span className="text-destructive text-[11px] font-medium">
            {t(statusKey)}
          </span>
        </div>
      )}

      {/* ── Header + description, one flush block ── */}
      <div>
        <div className="container flex items-center gap-2 pt-3 pb-1">
          <HugeiconsIcon icon={meta.icon} className="text-primary size-4" />
          <span className="text-foreground text-[13px] font-bold">
            {headerLabel}
          </span>
        </div>
        {details && (
          <p className="text-muted-foreground container pb-2.5 text-[12.5px] leading-relaxed whitespace-pre-line">
            {details}
          </p>
        )}
      </div>

      {/* No separate "Rating" row here — `google.rating`/`userRatingCount`
          feed into the ONE combined rating indicator shown in the profile
          header and the Reviews tab (`mergeRatingSummary`) instead of
          showing Google's number a second time on this tab. */}

      {/* ── Category-specific facts ── */}
      {facts.length > 0 && (
        <>
          {facts.map((fact, index) => (
            <FactRow key={index} fact={fact} />
          ))}
        </>
      )}

      {/* ── Call + website + social links (Qura first, Google fills a
          missing phone/website only) ── */}
      {hasContacts && (
        <div>
          <div className="container flex items-center gap-2 py-2.5">
            {effectivePhones && effectivePhones.length > 0 && (
              <CallButton phones={effectivePhones} />
            )}
            {effectiveWebsite && (
              <a
                href={effectiveWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-muted flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5"
              >
                <HugeiconsIcon
                  icon={GlobalIcon}
                  className="text-foreground size-4.5"
                />
                <span className="text-foreground text-[10.5px] font-semibold">
                  {t("Website")}
                </span>
              </a>
            )}
            {otherSocialLinks.map((link, index) => {
              const platform = detectSocialPlatform(link);
              return (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5"
                >
                  <HugeiconsIcon
                    icon={platform.icon}
                    className="text-foreground size-4.5"
                  />
                  <span className="text-foreground text-[10.5px] font-semibold">
                    {t(platform.label)}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Menu URL (food-drinks only) ── */}
      {category === "food-drinks" && !!data.menuUrl && (
        <div>
          <div className="container py-2.5">
            <a
              href={String(data.menuUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="from-primary/10 to-primary/5 flex items-center justify-between gap-3 rounded-2xl bg-linear-to-br p-3.5"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary flex size-10.5 shrink-0 items-center justify-center rounded-xl">
                  <HugeiconsIcon
                    icon={meta.icon}
                    className="text-primary-foreground size-5"
                    strokeWidth={1.8}
                  />
                </span>
                <span className="text-foreground text-[13.5px] font-bold">
                  {t("View menu")}
                </span>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="text-foreground size-4 shrink-0"
              />
            </a>
          </div>
        </div>
      )}

      {/* ── Working hours (Qura's structured hours win; Google's plain
          description lines only ever appear when Qura has none) ── */}
      {qura.workingHours ? (
        <div>
          <WorkingHoursAccordion hours={qura.workingHours} />
        </div>
      ) : (
        effectiveWorkingHoursLines && (
          <div>
            <WorkingHoursAccordionFromDescriptions
              lines={effectiveWorkingHoursLines}
            />
          </div>
        )
      )}

      {/* ── Location — always last ── */}
      {effectiveLocation && (
        <LocationSection
          location={effectiveLocation}
          mapsUrl={mapsUrl}
          mapsEmbedUrl={mapsEmbedUrl}
        />
      )}
    </div>
  );
}
