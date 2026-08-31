"use client";

import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, MapsLocation01Icon } from "@hugeicons/core-free-icons";

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
type Fact = { label: string; value: ReactNode };

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

function CallButton({ phones }: { phones: string[] }) {
  const { t } = useLocale();
  if (phones.length === 1) {
    return (
      <a
        href={`tel:${phones[0]}`}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1.5",
        )}
      >
        <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
        {t("Call")}
      </a>
    );
  }

  return (
    <details className="relative">
      <summary
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "list-none gap-1.5 [&::-webkit-details-marker]:hidden",
        )}
      >
        <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
        {t("Call")}
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

function WorkingHoursAccordion({ hours }: { hours: WorkingHours }) {
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

// ─── Fact Row ─────────────────────────────────────────────────────────────────

function FactRow({ fact }: { fact: Fact }) {
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

function LocationSection({
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
      <div className="container flex items-start justify-between gap-4 py-2 text-[12.5px]">
        <div className="text-muted-foreground">{t("Location")}</div>
        <div className="text-foreground flex items-center gap-1.5 font-medium">
          <span>{location.description}</span>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-6 shrink-0",
              )}
            >
              <HugeiconsIcon icon={MapsLocation01Icon} className="size-3.5" />
              <span className="sr-only">{t("Open in Google Maps")}</span>
            </a>
          )}
        </div>
      </div>
      {mapsEmbedUrl && (
        <div className="container aspect-video max-h-60 w-full px-0!">
          <iframe
            src={mapsEmbedUrl}
            title={t("Location")}
            loading="lazy"
            className="size-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessBlockCard({
  category,
  data,
}: {
  category: BusinessCategory | null | undefined;
  data: Record<string, unknown> | null | undefined;
}) {
  const { t } = useLocale();
  if (!category || !data) return null;

  const meta = CATEGORY_META[category];
  const location = data.location as Location | undefined;
  const phones = data.phones as string[] | undefined;
  const socialLinks = data.socialLinks as string[] | undefined;
  const workingHours = data.workingHours as WorkingHours | undefined;
  const mapsUrl = location ? googleMapsUrl(location) : null;
  const mapsEmbedUrl = location ? googleMapsEmbedUrl(location) : null;

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
    (phones && phones.length > 0) || (socialLinks && socialLinks.length > 0);

  return (
    <div className="divide-border/50 flex flex-col divide-y overflow-hidden">
      {/* ── Header ── */}
      <div className="bg-muted/80">
        <div className="container flex items-center gap-2 py-2.5">
          <HugeiconsIcon icon={meta.icon} className="text-primary size-4" />
          <span className="text-foreground text-[13px] font-semibold">
            {headerLabel}
          </span>
        </div>
      </div>

      {/* ── Description / details ── */}
      {details && (
        <div>
          <p className="text-muted-foreground container py-2.5 text-[12.5px] leading-relaxed whitespace-pre-line">
            {details}
          </p>
        </div>
      )}

      {/* ── Category-specific facts ── */}
      {facts.length > 0 && (
        <>
          {facts.map((fact, index) => (
            <FactRow key={index} fact={fact} />
          ))}
        </>
      )}

      {/* ── Call + social links ── */}
      {hasContacts && (
        <div>
          <div className="container flex items-center gap-2 py-2.5">
            {phones && phones.length > 0 && <CallButton phones={phones} />}
            {socialLinks?.map((link, index) => {
              const platform = detectSocialPlatform(link);
              return (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(platform.label)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={platform.icon} className="size-4.5" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Menu URL (food-drinks only) ── */}
      {category === "food-drinks" && !!data.menuUrl && (
        <div>
          <div className="container flex flex-col gap-1.5 py-2.5">
            <a
              href={String(data.menuUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-[12.5px] font-medium hover:underline"
            >
              {t("View menu")}
            </a>
          </div>
        </div>
      )}

      {/* ── Working hours accordion ── */}
      {workingHours && (
        <div>
          <WorkingHoursAccordion hours={workingHours} />
        </div>
      )}

      {/* ── Location — always last ── */}
      {location && (
        <LocationSection
          location={location}
          mapsUrl={mapsUrl}
          mapsEmbedUrl={mapsEmbedUrl}
        />
      )}
    </div>
  );
}
